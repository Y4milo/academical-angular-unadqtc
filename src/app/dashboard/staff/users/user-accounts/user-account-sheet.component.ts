import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SharedModule } from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TimelineModule } from 'primeng/timeline';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { FormFieldComponent } from '../../../../core/components/form-field.component';
import { StatusTagComponent } from '../../../../core/components/status-tag.component';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { AccountHolder, AccountHolders, CorePersonLookup, UserAccountsService } from '../../../../services/user-accounts.service';
import { NotificationService } from '../../../../services/notification.service';
import { HOLDER_EXPIRING_DAYS, KIND_LABELS } from './user-accounts.component';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';
type LookupState = 'idle' | 'loading' | 'found' | 'missing' | 'error';

const MS_PER_DAY = 86_400_000;

/** Ficha de una cuenta funcional: quién la usa hoy, con qué orden de servicio, y el historial. El titular solo lo ve el administrador. */
@Component({
  selector: 'app-user-account-sheet',
  imports: [
    DatePipe, FormsModule, RouterLink, ButtonModule, DialogModule, InputTextModule, MessageModule, SharedModule, ProgressBarModule, SelectModule,
    SkeletonModule, TimelineModule, AppLucideIconComponent, FormFieldComponent, StatusTagComponent,
  ],
  templateUrl: './user-account-sheet.component.html',
  styleUrl: './user-account-sheet.component.css',
})
export class UserAccountSheetComponent implements OnInit {
  readonly listLink = ['/', PATHS.admin.path, 'users', 'accounts'];
  readonly documentTypes = [{ label: 'DNI', value: 'dni' }, { label: 'Carné de extranjería', value: 'ce' }, { label: 'Pasaporte', value: 'passport' }];

  readonly data = signal<AccountHolders | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);

  readonly current = computed(() => this.data()?.holders.find(holder => holder.is_current) ?? null);
  readonly history = computed(() => this.data()?.holders ?? []);
  readonly isFunctional = computed(() => this.data()?.kind === 'functional');

  /** Diálogo de registro: nuevo titular o cambio del vigente. */
  assignOpen = false;
  replacing = false;
  documentType = 'dni';
  documentNumber = '';
  serviceOrder = '';
  validFrom = '';
  validTo = '';
  lookupState: LookupState = 'idle';
  lookupPerson: CorePersonLookup | null = null;
  lookupMessage = '';
  submitted = false;

  /** Diálogo de cierre del titular vigente. */
  closeOpen = false;
  closeReason = '';
  closeSubmitted = false;

  constructor(private route: ActivatedRoute, private service: UserAccountsService, private notifications: NotificationService) {}

  private get userId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.holders(this.userId).subscribe({
      next: response => {
        this.data.set(response.payload.data);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  kindLabel(): string {
    const kind = this.data()?.kind;
    return kind ? KIND_LABELS[kind] : '';
  }

  /** Estado, texto de plazo y porcentaje transcurrido de la orden de servicio del titular vigente. */
  holderStatus(holder: AccountHolder): { label: string; severity: Severity; note: string; percent: number } {
    if (!holder.valid_to) {
      return { label: 'Vigente', severity: 'success', note: 'Sin fecha de fin', percent: 0 };
    }
    const left = this.daysBetween(holder.valid_to);
    const total = Math.max(1, Math.round((new Date(`${holder.valid_to}T00:00:00`).getTime() - new Date(`${holder.valid_from}T00:00:00`).getTime()) / MS_PER_DAY));
    const percent = Math.min(100, Math.max(0, Math.round(((total - left) / total) * 100)));
    if (left < 0) {
      return { label: 'O/S vencida', severity: 'danger', note: `Venció hace ${-left} ${-left === 1 ? 'día' : 'días'}`, percent: 100 };
    }
    if (left <= HOLDER_EXPIRING_DAYS) {
      return { label: 'Por vencer', severity: 'warn', note: left === 0 ? 'Vence hoy' : `Vence en ${left} ${left === 1 ? 'día' : 'días'}`, percent };
    }
    return { label: 'Vigente', severity: 'success', note: `Vence en ${left} días`, percent };
  }

  /** `YYYY-MM-DD` como `dd/MM/yyyy` sin pasar por Date: una fecha sin hora se leería en UTC y se vería un día antes. */
  fmt(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  private daysBetween(date: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((new Date(`${date}T00:00:00`).getTime() - today.getTime()) / MS_PER_DAY);
  }

  openAssign(replacing: boolean): void {
    this.replacing = replacing;
    this.documentType = 'dni';
    this.documentNumber = '';
    this.serviceOrder = '';
    this.validFrom = new Date().toISOString().slice(0, 10);
    this.validTo = '';
    this.lookupState = 'idle';
    this.lookupPerson = null;
    this.lookupMessage = '';
    this.submitted = false;
    this.assignOpen = true;
  }

  onDocumentChange(): void {
    this.lookupState = 'idle';
    this.lookupPerson = null;
  }

  search(): void {
    const number = this.documentNumber.trim();
    if (!number) {
      this.lookupState = 'error';
      this.lookupMessage = 'Escribe el número de documento.';
      return;
    }
    this.lookupState = 'loading';
    this.service.lookupPerson(this.documentType, number).subscribe({
      next: response => {
        if (response.status !== 'success') {
          this.lookupState = 'error';
          this.lookupMessage = response.payload.message;
          return;
        }
        this.lookupPerson = response.payload.data;
        this.lookupState = this.lookupPerson ? 'found' : 'missing';
        if (this.lookupPerson && !this.lookupPerson.is_active) {
          this.lookupState = 'error';
          this.lookupMessage = 'La persona está inactiva en Core.';
          this.lookupPerson = null;
        }
      },
      error: () => {
        this.lookupState = 'error';
        this.lookupMessage = 'No se pudo consultar a Core. Inténtalo de nuevo.';
      },
    });
  }

  get serviceOrderError(): string {
    return this.submitted && !this.serviceOrder.trim() ? 'Escribe el número de la orden de servicio.' : '';
  }

  get validFromError(): string {
    return this.submitted && !this.validFrom ? 'Indica desde cuándo rige la orden de servicio.' : '';
  }

  get validToError(): string {
    return this.submitted && this.validTo && this.validFrom && this.validTo < this.validFrom ? 'No puede terminar antes de empezar.' : '';
  }

  saveHolder(): void {
    this.submitted = true;
    if (this.lookupState !== 'found' || !this.serviceOrder.trim() || !this.validFrom || this.validToError) {
      return;
    }
    this.saving.set(true);
    this.service.assign(this.userId, {
      document_type: this.documentType,
      document_number: this.documentNumber.trim(),
      service_order: this.serviceOrder.trim(),
      valid_from: this.validFrom,
      valid_to: this.validTo || null,
      ...(this.replacing ? { replace_reason: 'Cambio de titular' } : {}),
    }).subscribe({
      next: response => {
        this.saving.set(false);
        if (response.status === 'success') {
          this.assignOpen = false;
          this.load();
          return;
        }
        this.notifications.notifyApiData(response);
      },
      error: error => {
        this.saving.set(false);
        this.notifications.notifyApiData(error);
      },
    });
  }

  openClose(): void {
    this.closeReason = '';
    this.closeSubmitted = false;
    this.closeOpen = true;
  }

  get closeReasonError(): string {
    return this.closeSubmitted && !this.closeReason.trim() ? 'Escribe el motivo del cierre.' : '';
  }

  confirmClose(): void {
    this.closeSubmitted = true;
    const holder = this.current();
    if (!holder || !this.closeReason.trim()) {
      return;
    }
    this.saving.set(true);
    this.service.close(this.userId, holder.id, this.closeReason.trim()).subscribe({
      next: response => {
        this.saving.set(false);
        if (response.status === 'success') {
          this.closeOpen = false;
          this.load();
          return;
        }
        this.notifications.notifyApiData(response);
      },
      error: error => {
        this.saving.set(false);
        this.notifications.notifyApiData(error);
      },
    });
  }
}
