import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SharedModule } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { StatusTagComponent } from '../../../../core/components/status-tag.component';
import {
  AccountValidationService, ToCreateRow, ValidationCase, WithoutCore, WithoutCoreRow,
} from '../../../../services/account-validation.service';
import { NotificationService } from '../../../../services/notification.service';

type Tab = 'decide' | 'create' | 'without-core';
type Action = 'confirm' | 'create-account' | 'unlink';

export const CASE_TYPE_LABELS: Record<string, string> = {
  possible_duplicate: 'Posible duplicado',
  name_mismatch: 'Mismo documento, nombre distinto',
};

export const PROFILE_LABELS: Record<string, string> = { teacher: 'Docente', administrative: 'Administrativo' };

/**
 * Validación de cuentas. Documento y nombre deben calzar los dos para vincular sola; si falla uno, decide el administrador. Core es la fuente de verdad:
 * al confirmar, el nombre pasa a ser el de Core y el documento solo se corrige si Core lo verificó con una fuente de confianza. Quien no está en Core se
 * suspende, nunca se borra. Solo administrador.
 */
@Component({
  selector: 'app-account-validation',
  imports: [
    DatePipe, FormsModule, ButtonModule, CardModule, DialogModule, MessageModule, SelectButtonModule, SharedModule, SkeletonModule, TableModule, TimelineModule,
    AppLucideIconComponent, StatusTagComponent,
  ],
  templateUrl: './account-validation.component.html',
  styleUrl: './account-validation.component.css',
})
export class AccountValidationComponent implements OnInit {
  readonly tab = signal<Tab>('decide');
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly refreshing = signal(false);

  readonly cases = signal<ValidationCase[]>([]);
  readonly counts = signal({ to_decide: 0, to_create: 0, without_core: 0, resolved: 0 });
  readonly toCreate = signal<ToCreateRow[]>([]);
  readonly withoutCore = signal<WithoutCore>({ to_suspend: [], blocked: [] });
  readonly skeletonRows = Array.from({ length: 3 }, (_, index) => index);

  selectedToCreate: ToCreateRow[] = [];

  /** Diálogo de confirmación de un caso, de las personas por crear o de la suspensión. */
  dialogOpen = false;
  action: Action | 'create-many' | 'suspend' | null = null;
  active: ValidationCase | null = null;

  readonly tabOptions = computed(() => [
    { label: `Por decidir (${this.counts().to_decide})`, value: 'decide' as Tab },
    { label: `Por crear (${this.counts().to_create})`, value: 'create' as Tab },
    { label: `Sin Core (${this.counts().without_core})`, value: 'without-core' as Tab },
  ]);

  readonly creatable = computed(() => this.toCreate().filter(row => row.blocked_reason === null));

  constructor(private service: AccountValidationService, private notification: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.summary().subscribe({
      next: response => {
        const data = response.payload.data;
        this.cases.set(data?.cases ?? []);
        this.counts.set(data?.counts ?? { to_decide: 0, to_create: 0, without_core: 0, resolved: 0 });
        this.loading.set(false);
        this.loadLists();
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadLists(): void {
    this.service.toCreate().subscribe({ next: response => this.toCreate.set(response.payload.data ?? []), error: () => this.toCreate.set([]) });
    this.service.withoutCore().subscribe({ next: response => this.withoutCore.set(response.payload.data ?? { to_suspend: [], blocked: [] }), error: () => undefined });
  }

  typeLabel(type: string): string {
    return CASE_TYPE_LABELS[type] ?? type;
  }

  profileLabel(type: string): string {
    return PROFILE_LABELS[type] ?? type;
  }

  strengthLabel(strength: string): string {
    return strength === 'high' ? 'Coincidencia alta' : 'Coincidencia media';
  }

  /** Por qué se marcó el caso, en una frase. */
  why(item: ValidationCase): string {
    if (item.type === 'name_mismatch') {
      return item.same_document
        ? 'El documento es el mismo pero el nombre no calza con el que envía Core.'
        : 'El nombre no calza con el que envía Core.';
    }

    return item.academical?.user
      ? 'Mismo nombre que una persona de Core que no tiene usuario, con otro documento: crear una cuenta la duplicaría.'
      : 'Hay una ficha de personal con el mismo nombre y sin usuario: crear una cuenta podría duplicar a esa persona.';
  }

  open(action: Action, item: ValidationCase): void {
    this.action = action;
    this.active = item;
    this.dialogOpen = true;
  }

  openCreateMany(): void {
    this.action = 'create-many';
    this.active = null;
    this.dialogOpen = true;
  }

  openSuspend(): void {
    this.action = 'suspend';
    this.active = null;
    this.dialogOpen = true;
  }

  dialogTitle(): string {
    switch (this.action) {
      case 'confirm': return 'Revisar antes de vincular';
      case 'create-account': return 'Crear una cuenta distinta';
      case 'unlink': return 'Quitar el vínculo';
      case 'create-many': return 'Crear las cuentas seleccionadas';
      default: return 'Suspender a quienes no están en Core';
    }
  }

  confirmLabel(): string {
    switch (this.action) {
      case 'confirm': return 'Confirmar y vincular';
      case 'create-account': return 'Crear cuenta';
      case 'unlink': return 'Quitar vínculo';
      case 'create-many': return `Crear ${this.selectedToCreate.length} cuentas`;
      default: return `Suspender ${this.withoutCore().to_suspend.length} usuarios`;
    }
  }

  /** Lo que pasará al confirmar que es la misma persona, en frases cortas. */
  confirmEffects(): string[] {
    const core = this.active?.core;
    if (!core) return [];

    const effects = ['El usuario queda vinculado con la persona de Core.', `El nombre pasa a ser el de Core, tal cual lo envía: ${core.name}.`];
    if (!this.active?.same_document) {
      effects.push(`El documento se corrige al de Core (${core.document}) y el nombre de acceso cambia a ese documento.`);
    }

    return effects;
  }

  canConfirmDialog(): boolean {
    if (this.action === 'confirm') return !!this.active?.can_confirm;
    if (this.action === 'create-many') return this.selectedToCreate.length > 0;
    if (this.action === 'suspend') return this.withoutCore().to_suspend.length > 0;
    return true;
  }

  confirm(): void {
    if (!this.canConfirmDialog() || this.saving()) return;
    this.saving.set(true);

    const done = (response: { status: string }): void => {
      this.saving.set(false);
      this.notification.notifyApiData(response as never);
      if (response.status === 'success') {
        this.dialogOpen = false;
        this.selectedToCreate = [];
        this.load();
      }
    };
    const failed = (error: unknown): void => {
      this.saving.set(false);
      this.notification.notifyApiData(error as never);
    };

    switch (this.action) {
      case 'confirm': this.service.confirm(this.active!.id).subscribe({ next: done, error: failed }); break;
      case 'create-account': this.service.createAccount(this.active!.id).subscribe({ next: done, error: failed }); break;
      case 'unlink': this.service.unlink(this.active!.id).subscribe({ next: done, error: failed }); break;
      case 'create-many': this.service.createMany(this.selectedToCreate.map(row => row.core_person_id)).subscribe({ next: done, error: failed }); break;
      case 'suspend': this.service.suspendWithoutCore().subscribe({ next: done, error: failed }); break;
    }
  }

  /** Actualiza desde Core lo que cambió (personal, identidad y nombres) y vuelve a revisar los casos. */
  refresh(): void {
    if (this.refreshing()) return;
    this.refreshing.set(true);

    this.service.detect().subscribe({
      next: response => {
        this.refreshing.set(false);
        this.notification.notifyApiData(response);
        this.load();
      },
      error: error => {
        this.refreshing.set(false);
        this.notification.notifyApiData(error);
      },
    });
  }

  trackBlocked(row: WithoutCoreRow): number {
    return row.id;
  }
}
