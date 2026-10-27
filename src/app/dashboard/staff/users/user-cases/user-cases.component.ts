import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { FormFieldComponent } from '../../../../core/components/form-field.component';
import { StatusTagComponent } from '../../../../core/components/status-tag.component';
import { dateToIso } from '../../../../core/utils/date-input.util';
import { NotificationService } from '../../../../services/notification.service';
import {
  CaseAction,
  CaseActionResponse,
  CaseCode,
  CaseStatus,
  UserCase,
  UserCaseFilters,
  UserCasesPage,
  UserCasesService,
} from '../../../../services/user-cases.service';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

export const CASE_LABELS: Record<CaseCode, string> = {
  not_linked: 'Sin vínculo con Core',
  separated_active: 'Baja en Core con acceso activo',
  duplicate_link: 'Vínculo duplicado',
  profile_missing: 'Persona ausente de la copia de Core',
  functional_without_holder: 'Cuenta funcional sin titular',
  holder_expired: 'Orden de servicio vencida',
  inactive: 'Sin actividad',
};

export const STATUS_LABELS: Record<CaseStatus, string> = { open: 'Abierto', in_management: 'En gestión', postponed: 'Pospuesto', resolved: 'Resuelto' };

const STATUS_SEVERITY: Record<CaseStatus, Severity> = { open: 'warn', in_management: 'info', postponed: 'secondary', resolved: 'success' };

export const ACTION_LABELS: Record<CaseAction, string> = {
  suspend: 'Suspender usuario',
  keep: 'Mantener con motivo',
  postpone: 'Posponer',
  manage: 'Marcar en gestión',
  reopen: 'Reabrir',
};

const ACTION_OUTCOME: Record<CaseAction, string> = {
  suspend: 'suspender y cerrar sus sesiones',
  keep: 'mantener el acceso con el motivo',
  postpone: 'posponer el caso',
  manage: 'pasar a en gestión',
  reopen: 'volver a abrir',
};

const STATUS_FILTERS: { label: string; value: CaseStatus }[] = [
  { label: 'Abiertos', value: 'open' },
  { label: 'En gestión', value: 'in_management' },
  { label: 'Pospuestos', value: 'postponed' },
  { label: 'Resueltos', value: 'resolved' },
];

/** Bandeja de depuración de usuarios: casos que la reconciliación con Core abre y el administrador cierra. Solo administrador. */
@Component({
  selector: 'app-user-cases',
  imports: [
    DatePipe, FormsModule, ButtonModule, CardModule, DatePickerModule, DialogModule, InputTextModule, MessageModule, PaginatorModule, SelectModule, SelectButtonModule, SkeletonModule, TableModule,
    AppLucideIconComponent, FormFieldComponent, StatusTagComponent,
  ],
  templateUrl: './user-cases.component.html',
  styleUrl: './user-cases.component.css',
})
export class UserCasesComponent implements OnInit, OnDestroy {
  readonly statusFilters = STATUS_FILTERS;
  readonly skeletonRows = Array.from({ length: 5 }, (_, index) => index);
  readonly perPage = 25;

  readonly page = signal<UserCasesPage | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly exporting = signal(false);

  readonly status = signal<CaseStatus>('open');
  readonly code = signal<CaseCode | null>(null);
  readonly pageNumber = signal(1);
  search = '';

  selection: UserCase[] = [];

  readonly cases = computed(() => this.page()?.cases ?? []);
  readonly summaryCards = computed(() => {
    const byCode = this.page()?.summary.open_by_code ?? {};
    return (Object.keys(byCode) as CaseCode[]).map(code => ({ code, label: CASE_LABELS[code] ?? code, total: byCode[code] ?? 0 }));
  });
  readonly unresolvedTotal = computed(() => this.summaryCards().reduce((sum, card) => sum + card.total, 0));

  /* Diálogo de acción (uno o varios casos). */
  dialogVisible = false;
  dialogCases: UserCase[] = [];
  action: CaseAction = 'suspend';
  note = '';
  until: Date | null = null;
  formError = '';
  working = false;
  outcome: CaseActionResponse | null = null;

  private readonly search$ = new Subject<void>();
  private searchSub?: Subscription;

  constructor(private service: UserCasesService, private notifications: NotificationService) {}

  ngOnInit(): void {
    this.searchSub = this.search$.pipe(debounceTime(300)).subscribe(() => {
      this.pageNumber.set(1);
      this.load();
    });
    this.load();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  private filters(): UserCaseFilters {
    return { status: [this.status()], code: this.code(), search: this.search };
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.list(this.filters(), this.pageNumber(), this.perPage).subscribe({
      next: response => {
        this.page.set(response.payload.data ?? null);
        this.selection = [];
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.search$.next();
  }

  setStatus(status: CaseStatus): void {
    this.status.set(status);
    this.pageNumber.set(1);
    this.load();
  }

  setCode(code: CaseCode | null): void {
    this.code.set(this.code() === code ? null : code);
    this.pageNumber.set(1);
    this.load();
  }

  onPage(event: PaginatorState): void {
    this.pageNumber.set((event.page ?? 0) + 1);
    this.load();
  }

  exportExcel(): void {
    this.exporting.set(true);
    this.service.export(this.filters()).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'depuracion_usuarios.xlsx';
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

  caseLabel(code: CaseCode): string {
    return CASE_LABELS[code] ?? code;
  }

  statusLabel(status: CaseStatus): string {
    return STATUS_LABELS[status];
  }

  statusSeverity(status: CaseStatus): Severity {
    return STATUS_SEVERITY[status];
  }

  /** Acciones que se ofrecen: un caso resuelto solo se puede reabrir; uno sin resolver, todo lo demás. */
  get actionOptions(): { label: string; value: CaseAction }[] {
    const resolved = this.dialogCases.length > 0 && this.dialogCases.every(item => item.status === 'resolved');
    const actions: CaseAction[] = resolved ? ['reopen'] : ['suspend', 'keep', 'postpone', 'manage'];
    return actions.map(value => ({ label: ACTION_LABELS[value], value }));
  }

  get needsNote(): boolean {
    return this.action === 'keep' || this.action === 'postpone';
  }

  /** Mañana: un caso pospuesto vuelve a abrirse desde esa fecha, nunca el mismo día. */
  get tomorrow(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    return date;
  }

  openDialog(cases: UserCase[]): void {
    this.dialogCases = cases;
    this.action = this.actionOptions[0].value;
    this.note = '';
    this.until = null;
    this.formError = '';
    this.outcome = null;
    this.dialogVisible = true;
  }

  resolveRow(item: UserCase): void {
    this.openDialog([item]);
  }

  /** Cambiar la acción borra la simulación anterior: ya no corresponde a lo que se va a aplicar. */
  onActionChange(): void {
    this.outcome = null;
    this.formError = '';
  }

  simulate(): void {
    this.run(true);
  }

  confirm(): void {
    this.run(false);
  }

  private run(dryRun: boolean): void {
    this.formError = '';
    if (this.needsNote && !this.note.trim()) {
      this.formError = 'Escribe el motivo.';
      return;
    }
    if (this.action === 'postpone' && (!this.until || this.until < this.tomorrow)) {
      this.formError = 'Elige una fecha posterior a hoy.';
      return;
    }

    this.working = true;
    const input = { action: this.action, note: this.note.trim() || null, until: this.action === 'postpone' ? dateToIso(this.until) : null };
    this.service.apply(this.dialogCases.map(item => item.id), input, dryRun).subscribe({
      next: response => {
        this.working = false;
        if (response.status !== 'success') {
          this.formError = response.payload.message;
          return;
        }
        this.outcome = response.payload.data ?? null;
        if (!dryRun) {
          const applied = this.outcome?.summary.applied ?? 0;
          this.notifications.success('Casos actualizados', applied === 1 ? 'Se actualizó 1 caso.' : `Se actualizaron ${applied} casos.`);
          this.dialogVisible = false;
          this.load();
        }
      },
      error: () => {
        this.working = false;
        this.formError = 'No se pudo completar. Revisa tu conexión e inténtalo de nuevo.';
      },
    });
  }

  outcomeText(result: { outcome: string; reason: string | null }): string {
    return result.outcome === 'skipped' ? (result.reason ?? 'Se omite.') : `Se va a ${ACTION_OUTCOME[this.action]}.`;
  }
}
