import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { FormFieldComponent } from '../../../../core/components/form-field.component';
import { StatusTagComponent } from '../../../../core/components/status-tag.component';
import { dateTimeToDate, dateToDateTime } from '../../../../core/utils/date-input.util';
import { NotificationService } from '../../../../services/notification.service';
import { Semester, SemestersService } from '../../../../services/semesters.service';
import { CardModulePayload, CardPayment, CardPaymentsPage, CardSettings, StudentCardModuleService } from '../../../../services/student-card-module.service';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

const CARD_SEVERITY: Record<string, Severity> = { validated: 'success', pending: 'info', flagged: 'warn', unregistered: 'secondary', no_student: 'danger', deleted: 'secondary', current: 'info' };

/** Módulo de carné universitario: configuración del semestre y pagos del semestre. Administrador y académico. */
@Component({
  selector: 'app-student-card-settings',
  imports: [FormsModule, ButtonModule, DatePickerModule, InputNumberModule, InputTextModule, MessageModule, PaginatorModule, SelectModule, SkeletonModule, TableModule, ToggleSwitchModule, AppLucideIconComponent, FormFieldComponent, StatusTagComponent],
  templateUrl: './student-card-settings.component.html',
  styleUrl: './student-card-settings.component.css',
})
export class StudentCardSettingsComponent implements OnInit, OnDestroy {
  readonly perPage = 25;
  readonly skeletonRows = [0, 1, 2];

  readonly semesters = signal<Semester[]>([]);
  readonly semesterId = signal<number | null>(null);
  readonly module = signal<CardModulePayload | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  /** Copia editable de la configuración: las fechas de subida van como Date para el selector. */
  form: CardSettings | null = null;
  startAt: Date | null = null;
  endAt: Date | null = null;
  note = '';
  formError = '';
  saving = false;
  copying = false;

  readonly page = signal<CardPaymentsPage | null>(null);
  readonly paymentsLoading = signal(false);
  readonly exporting = signal(false);
  pageNumber = 1;
  statusFilter: string | null = null;
  cardFilter: string | null = null;
  search = '';

  readonly selectable = computed(() => this.semesters().filter(item => item.state !== 'draft'));
  readonly payments = computed<CardPayment[]>(() => this.page()?.payments ?? []);
  readonly paymentOptions = computed(() => [{ value: null, label: 'Todos los estados' }, ...(this.page()?.options.payment ?? [])]);
  readonly cardOptions = computed(() => [{ value: null, label: 'Todos los carnés' }, ...(this.page()?.options.card ?? [])]);

  private readonly search$ = new Subject<void>();
  private searchSub?: Subscription;

  constructor(private semestersService: SemestersService, private service: StudentCardModuleService, private notifications: NotificationService) {}

  ngOnInit(): void {
    this.searchSub = this.search$.pipe(debounceTime(300)).subscribe(() => {
      this.pageNumber = 1;
      this.loadPayments();
    });
    this.semestersService.list().subscribe({
      next: response => {
        this.semesters.set(response.payload.data?.semesters ?? []);
        const preferred = this.selectable().find(item => item.state === 'current') ?? this.selectable().find(item => item.state === 'enabled') ?? this.selectable()[0];
        if (preferred) {
          this.pick(preferred.id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  pick(id: number): void {
    this.semesterId.set(id);
    this.pageNumber = 1;
    this.statusFilter = null;
    this.cardFilter = null;
    this.search = '';
    this.loadModule();
    this.loadPayments();
  }

  loadModule(): void {
    const id = this.semesterId();
    if (id === null) {
      return;
    }
    this.loading.set(true);
    this.loadError.set(false);
    this.service.show(id).subscribe({
      next: response => {
        this.apply(response.payload.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private apply(payload: CardModulePayload | null): void {
    this.module.set(payload);
    this.form = payload ? { ...payload.settings } : null;
    this.startAt = dateTimeToDate(payload?.settings.upload_start);
    this.endAt = dateTimeToDate(payload?.settings.upload_end);
    this.note = '';
    this.formError = '';
  }

  save(): void {
    const id = this.semesterId();
    const module = this.module();
    if (id === null || !this.form || !module) {
      return;
    }
    this.formError = '';
    if (module.locked && !this.note.trim()) {
      this.formError = 'La ventana de subida ya cerró. Escribe el motivo del cambio.';
      return;
    }
    if (!!this.startAt !== !!this.endAt) {
      this.formError = 'Indica el inicio y el fin de la subida, o ninguno.';
      return;
    }
    if (this.startAt && this.endAt && this.endAt <= this.startAt) {
      this.formError = 'El fin de la subida debe ser posterior al inicio.';
      return;
    }
    if (this.form.photo_max_kb < this.form.photo_min_kb) {
      this.formError = 'El tamaño máximo de la foto no puede ser menor que el mínimo.';
      return;
    }

    this.saving = true;
    this.service.save(id, { ...this.form, upload_start: dateToDateTime(this.startAt), upload_end: dateToDateTime(this.endAt) }, this.note.trim() || null).subscribe({
      next: response => {
        this.saving = false;
        if (response.status !== 'success') {
          this.formError = response.payload.message;
          return;
        }
        this.apply(response.payload.data ?? null);
        this.notifications.success(response.payload.title, response.payload.message);
      },
      error: () => {
        this.saving = false;
        this.formError = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.';
      },
    });
  }

  copyPrevious(): void {
    const id = this.semesterId();
    if (id === null) {
      return;
    }
    this.copying = true;
    this.service.copyFromPrevious(id).subscribe({
      next: response => {
        this.copying = false;
        if (response.status !== 'success') {
          this.notifications.error(response.payload.title, response.payload.message);
          return;
        }
        this.apply(response.payload.data ?? null);
        this.notifications.success(response.payload.title, response.payload.message);
      },
      error: () => {
        this.copying = false;
        this.notifications.error('No se pudo copiar', 'Revisa tu conexión e inténtalo de nuevo.');
      },
    });
  }

  private filters() {
    return { status: this.statusFilter, card_status: this.cardFilter, search: this.search };
  }

  loadPayments(): void {
    const id = this.semesterId();
    if (id === null) {
      return;
    }
    this.paymentsLoading.set(true);
    this.service.payments(id, this.filters(), this.pageNumber, this.perPage).subscribe({
      next: response => {
        this.page.set(response.payload.data ?? null);
        this.paymentsLoading.set(false);
      },
      error: () => {
        this.paymentsLoading.set(false);
        this.notifications.error('No se pudieron cargar los pagos', 'Revisa tu conexión e inténtalo de nuevo.');
      },
    });
  }

  onFilter(): void {
    this.pageNumber = 1;
    this.loadPayments();
  }

  onSearch(): void {
    this.search$.next();
  }

  onPage(event: PaginatorState): void {
    this.pageNumber = (event.page ?? 0) + 1;
    this.loadPayments();
  }

  exportExcel(): void {
    const id = this.semesterId();
    if (id === null) {
      return;
    }
    this.exporting.set(true);
    this.service.exportPayments(id, this.filters()).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `pagos_carnet_${this.module()?.semester.name ?? id}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => {
        this.exporting.set(false);
        this.notifications.error('No se pudo exportar', 'Inténtalo de nuevo en unos minutos.');
      },
    });
  }

  cardSeverity(status: string): Severity {
    return CARD_SEVERITY[status] ?? 'secondary';
  }
}
