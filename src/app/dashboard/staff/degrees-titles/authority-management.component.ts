import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {DatePipe, NgFor, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Avatar} from 'primeng/avatar';
import {BadgeModule} from 'primeng/badge';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {MessageModule} from 'primeng/message';
import {ProgressBarModule} from 'primeng/progressbar';
import {Select} from 'primeng/select';
import {SkeletonModule} from 'primeng/skeleton';
import {TableLazyLoadEvent, TableModule} from 'primeng/table';
import {TabsModule} from 'primeng/tabs';
import {TagModule} from 'primeng/tag';
import {Textarea} from 'primeng/textarea';
import {TimelineModule} from 'primeng/timeline';
import {finalize} from 'rxjs';
import {
  CoreFieldSource,
  CoreResolvedField,
  CoreSnapshotCheck,
  CoreSnapshotStatus,
  DegreeGeneralAuthority,
  DegreeGeneralAuthorityAudit,
  DegreeGeneralAuthorityCompletePayload,
  DegreeGeneralAuthorityDesignationPayload,
  DegreeGeneralAuthorityDictionaryRef,
  DegreeGeneralAuthorityRoleKey,
  DegreeGeneralAuthorityStaff,
  DegreesTitlesService,
} from '../../../services/degrees-titles.service';
import {NotificationService} from '../../../services/notification.service';
import {AuthorityDesignationFormComponent} from './authority-designation-form.component';
import {
  auditLabel, auditSeverity, changeActionLabel, changeValue, confirmActionLabel, daysUntil, designateActionLabel, displayName, fieldLabel, initials,
  INSTITUTIONAL_EMAIL_DOMAIN, isInstitutionalEmail, isResponsibleRole, isStaleSnapshot, maskDni, missingResolvedFields, personLabel, roleTitle,
  snapshotLabel, snapshotSeverity, sourceLabel, vigencyColor, vigencyPercent,
} from './degree-general-data.util';

type StatusFilter = 'all' | 'active' | 'previous';
type SortOrder = 'desc' | 'asc';
type ManagementTab = 'current' | 'core' | 'history' | 'audit';

interface FieldRow {
  field: CoreResolvedField;
  label: string;
  value: string | null;
  source: CoreFieldSource | undefined;
  missing: boolean;
}

@Component({
  selector: 'app-authority-management',
  imports: [
    Avatar, AuthorityDesignationFormComponent, BadgeModule, ButtonModule, DatePipe, DialogModule, FormsModule, InputTextModule, MessageModule,
    NgFor, NgIf, ProgressBarModule, Select, SkeletonModule, TableModule, TabsModule, TagModule, Textarea, TimelineModule,
  ],
  templateUrl: './authority-management.component.html',
  styleUrl: './degree-general-data.shared.css',
})
export class AuthorityManagementComponent implements OnChanges {
  @Input({required: true}) roleKey!: DegreeGeneralAuthorityRoleKey;
  @Input() prefixes: DegreeGeneralAuthorityDictionaryRef[] = [];
  @Output() back = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();

  readonly roleTitle = roleTitle;
  readonly changeActionLabel = changeActionLabel;
  readonly designateActionLabel = designateActionLabel;
  readonly confirmActionLabel = confirmActionLabel;
  readonly personLabel = personLabel;
  readonly isResponsibleRole = isResponsibleRole;
  readonly displayName = displayName;
  readonly initials = initials;
  readonly maskDni = maskDni;
  readonly snapshotLabel = snapshotLabel;
  readonly snapshotSeverity = snapshotSeverity;
  readonly isStaleSnapshot = isStaleSnapshot;
  readonly fieldLabel = fieldLabel;
  readonly changeValue = changeValue;
  readonly sourceLabel = sourceLabel;
  readonly auditLabel = auditLabel;
  readonly auditSeverity = auditSeverity;
  readonly vigencyColor = vigencyColor;
  readonly resolvedFields: CoreResolvedField[] = ['professional_prefix_id', 'academic_title', 'email', 'phone'];
  readonly emailDomain = INSTITUTIONAL_EMAIL_DOMAIN;

  activeTab: ManagementTab = 'current';

  completeVisible = false;
  completing = false;
  /** Cuando se completa desde una fila de la tabla solo se ofrece ese campo. */
  completeFocus: CoreResolvedField | null = null;
  completeForm = {professional_prefix_id: null as number | null, academic_title: '', email: '', phone: '', reason: ''};
  completeErrors: Partial<Record<CoreResolvedField | 'reason' | 'general', string>> = {};

  loading = false;
  verifying = false;
  refreshing = false;
  coreCheck: CoreSnapshotCheck | null = null;
  refreshedChanges: Record<string, {from: unknown; to: unknown}> | null = null;
  coreUnavailable = false;
  /** Core respondió pero no tiene a la persona como personal: sus datos de cargo se completan a mano. */
  notStaffInCore = false;
  history: DegreeGeneralAuthority[] = [];
  mode: 'view' | 'designate' = 'view';
  redesignatePrefill: DegreeGeneralAuthority | null = null;

  audits: DegreeGeneralAuthorityAudit[] = [];
  auditsLoading = false;
  auditsTotal = 0;
  readonly auditsPerPage = 15;

  searchTerm = '';
  statusFilter: StatusFilter = 'all';
  periodFilter = 'all';
  sortOrder: SortOrder = 'desc';

  confirmVisible = false;
  saving = false;
  pendingStaff: DegreeGeneralAuthorityStaff | null = null;
  pendingPayload: DegreeGeneralAuthorityDesignationPayload | null = null;

  readonly statusOptions = [
    {label: 'Todos', value: 'all'},
    {label: 'Vigente', value: 'active'},
    {label: 'Anteriores', value: 'previous'},
  ];
  readonly sortOptions = [
    {label: 'Más reciente primero', value: 'desc'},
    {label: 'Más antiguo primero', value: 'asc'},
  ];

  constructor(private readonly service: DegreesTitlesService, private readonly notifications: NotificationService) {}

  ngOnChanges(): void {
    this.mode = 'view';
    this.redesignatePrefill = null;
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.periodFilter = 'all';
    this.sortOrder = 'desc';
    this.coreCheck = null;
    this.refreshedChanges = null;
    this.coreUnavailable = false;
    this.notStaffInCore = false;
    this.activeTab = 'current';
    this.audits = [];
    this.auditsTotal = 0;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.getGeneralAuthorityHistory(this.roleKey)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: response => {
          this.history = response.data;
          // Si la copia de Core pide atención, se abre directamente esa pestaña.
          if (this.needsAttention) {
            this.activeTab = 'core';
          }
        },
        error: error => this.notifications.notifyApiData(error),
      });
  }

  get current(): DegreeGeneralAuthority | null {
    return this.history.find(item => item.active) ?? null;
  }

  /** Estado de la copia de CORE: la verificación en vivo (si se hizo) manda sobre la vigencia guardada. */
  get snapshotStatus(): CoreSnapshotStatus {
    return this.coreCheck?.status ?? this.current?.snapshot?.status ?? 'missing';
  }

  /** La copia vencida, sin sincronizar o desactualizada pide atención: se marca en la pestaña. */
  get needsAttention(): boolean {
    return !!this.current && isStaleSnapshot(this.snapshotStatus);
  }

  get daysLeft(): number {
    return daysUntil(this.current?.snapshot?.expires_at);
  }

  get vigencyLeft(): number {
    return vigencyPercent(this.current?.snapshot?.synced_at, this.current?.snapshot?.expires_at);
  }

  /** Cada dato de la designación con su valor real y de dónde viene. */
  get fieldRows(): FieldRow[] {
    const authority = this.current;
    if (!authority) {
      return [];
    }
    const values: Record<CoreResolvedField, string | null> = {
      professional_prefix_id: authority.professional_prefix?.label ?? null,
      academic_title: authority.academic_title?.trim() || null,
      email: authority.email?.trim() || null,
      phone: authority.phone?.trim() || null,
    };

    return this.resolvedFields.map(field => ({
      field,
      label: fieldLabel(field),
      value: values[field],
      source: authority.snapshot?.field_sources?.[field],
      missing: values[field] === null,
    }));
  }

  get checkChanges(): {field: string; from: unknown; to: unknown}[] {
    return Object.entries(this.coreCheck?.changes ?? {}).map(([field, change]) => ({field, ...change}));
  }

  get refreshChanges(): {field: string; from: unknown; to: unknown}[] {
    return Object.entries(this.refreshedChanges ?? {}).map(([field, change]) => ({field, ...change}));
  }

  /** Texto de un valor cambiado; el prefijo llega como id y se muestra su etiqueta. */
  changeText(field: string, value: unknown): string {
    if (field === 'professional_prefix_id' && typeof value === 'number') {
      return this.prefixes.find(prefix => prefix.id === value)?.label ?? String(value);
    }

    return changeValue(value);
  }

  /** Campos cuyo valor difiere de lo que Core entrega hoy (tras «Verificar con Core»). */
  isChanged(field: CoreResolvedField): boolean {
    return field in (this.coreCheck?.changes ?? {});
  }

  verifyWithCore(): void {
    if (this.verifying || this.refreshing) {
      return;
    }
    this.verifying = true;
    this.coreUnavailable = false;
    this.refreshedChanges = null;
    this.service.checkGeneralAuthority(this.roleKey)
      .pipe(finalize(() => (this.verifying = false)))
      .subscribe({
        next: response => {
          this.coreCheck = response.data;
          this.notStaffInCore = response.data.core_available && response.data.has_staff_profile === false;
        },
        error: error => {
          this.coreCheck = null;
          if (error?.status === 503) {
            this.coreUnavailable = true;
            return;
          }
          this.notifications.notifyApiData(error);
        },
      });
  }

  refreshFromCore(): void {
    if (this.verifying || this.refreshing) {
      return;
    }
    this.refreshing = true;
    this.coreUnavailable = false;
    this.service.refreshGeneralAuthority(this.roleKey)
      .pipe(finalize(() => (this.refreshing = false)))
      .subscribe({
        next: response => {
          this.refreshedChanges = response.data.changes;
          this.notStaffInCore = response.data.core_available !== false && response.data.has_staff_profile === false;
          this.coreCheck = null;
          this.history = this.history.map(item => (item.id === response.data.authority.id ? response.data.authority : item));
          this.audits = [];
          this.notifications.success('Datos generales', Object.keys(response.data.changes).length
            ? 'Datos actualizados desde Core.' : 'Los datos ya coinciden con Core. Se renovó la vigencia.');
          this.changed.emit();
        },
        error: error => {
          if (error?.status === 503) {
            this.coreUnavailable = true;
            return;
          }
          this.notifications.notifyApiData(error);
        },
      });
  }

  /** Carga perezosa de la auditoría: solo cuando se abre la pestaña o se cambia de página. */
  loadAudits(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.auditsPerPage;
    const page = Math.floor((event.first ?? 0) / rows) + 1;
    this.auditsLoading = true;
    this.service.getGeneralAuthorityAudits(this.roleKey, page, rows)
      .pipe(finalize(() => (this.auditsLoading = false)))
      .subscribe({
        next: response => {
          this.audits = response.data;
          this.auditsTotal = response.meta.total;
        },
        error: error => this.notifications.notifyApiData(error),
      });
  }

  auditChanges(audit: DegreeGeneralAuthorityAudit): {label: string; from: unknown; to: unknown}[] {
    return Object.entries(audit.changes ?? {})
      .filter(([, change]) => typeof change === 'object' && change !== null && 'to' in (change as object))
      .map(([field, change]) => ({label: fieldLabel(field), from: (change as {from: unknown}).from, to: (change as {to: unknown}).to}));
  }

  /** Solo se pueden completar los datos que aún no existen en la designación. */
  get missingFields(): CoreResolvedField[] {
    return this.current ? missingResolvedFields(this.current) : [];
  }

  isMissing(field: CoreResolvedField): boolean {
    return this.missingFields.includes(field);
  }

  /** Campos que muestra el diálogo: los que faltan (o solo el de la fila desde la que se abrió). */
  isCompletable(field: CoreResolvedField): boolean {
    return this.isMissing(field) && (this.completeFocus === null || this.completeFocus === field);
  }

  get completeEmailInvalid(): boolean {
    return this.isCompletable('email') && this.completeForm.email.trim() !== '' && !isInstitutionalEmail(this.completeForm.email);
  }

  get canComplete(): boolean {
    const hasValue = this.resolvedFields.some(field => this.isCompletable(field) && this.completeValue(field) !== null);

    return hasValue && this.completeForm.reason.trim().length >= 10 && !this.completeEmailInvalid && !this.completing;
  }

  openComplete(field: CoreResolvedField | null = null): void {
    this.completeFocus = field;
    this.completeForm = {professional_prefix_id: null, academic_title: '', email: '', phone: '', reason: ''};
    this.completeErrors = {};
    this.completeVisible = true;
  }

  submitComplete(): void {
    if (!this.canComplete) {
      return;
    }
    const payload: DegreeGeneralAuthorityCompletePayload = {reason: this.completeForm.reason.trim()};
    for (const field of this.resolvedFields) {
      const value = this.isCompletable(field) ? this.completeValue(field) : null;
      if (value !== null) {
        (payload as unknown as Record<string, unknown>)[field] = value;
      }
    }

    this.completing = true;
    this.completeErrors = {};
    this.service.completeGeneralAuthorityData(this.roleKey, payload)
      .pipe(finalize(() => (this.completing = false)))
      .subscribe({
        next: response => {
          this.completeVisible = false;
          this.history = this.history.map(item => (item.id === response.data.id ? response.data : item));
          this.audits = [];
          this.notifications.success('Datos generales', 'Datos completados. Quedó registrado quién y por qué.');
          this.changed.emit();
        },
        error: error => {
          const errors: Record<string, string[]> | undefined = error?.error?.errors;
          if (error?.status === 422 && errors) {
            for (const [field, messages] of Object.entries(errors)) {
              this.completeErrors[field as CoreResolvedField] = messages[0];
            }
            return;
          }
          if (error?.status === 422 && error?.error?.data?.status === 'no_changes') {
            this.completeErrors.general = 'No hay datos nuevos para guardar.';
            return;
          }
          if (error?.status === 503) {
            this.completeErrors.general = 'No fue posible verificar en Core en este momento. Intente nuevamente más tarde.';
            return;
          }
          this.notifications.notifyApiData(error);
        },
      });
  }

  private completeValue(field: CoreResolvedField): string | number | null {
    if (field === 'professional_prefix_id') {
      return this.completeForm.professional_prefix_id;
    }
    const value = this.completeForm[field].trim();

    return value === '' ? null : value;
  }

  get periodOptions(): {label: string; value: string}[] {
    const years = Array.from(new Set(this.history
      .map(item => item.activated_at ? new Date(item.activated_at).getFullYear() : null)
      .filter((year): year is number => year !== null)))
      .sort((a, b) => b - a);

    return [{label: 'Todos los periodos', value: 'all'}, ...years.map(year => ({label: String(year), value: String(year)}))];
  }

  get filteredHistory(): DegreeGeneralAuthority[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.history
      .filter(item => this.statusFilter === 'all' || (this.statusFilter === 'active') === item.active)
      .filter(item => this.periodFilter === 'all'
        || (item.activated_at && new Date(item.activated_at).getFullYear() === Number(this.periodFilter)))
      .filter(item => !term
        || item.staff.full_name.toLowerCase().includes(term)
        || item.staff.number.includes(term))
      .sort((a, b) => {
        const left = a.activated_at ? new Date(a.activated_at).getTime() : 0;
        const right = b.activated_at ? new Date(b.activated_at).getTime() : 0;

        return this.sortOrder === 'desc' ? right - left : left - right;
      });
  }

  startDesignate(): void {
    this.redesignatePrefill = null;
    this.mode = 'designate';
  }

  redesignate(entry: DegreeGeneralAuthority): void {
    this.redesignatePrefill = entry;
    this.mode = 'designate';
  }

  cancelDesignate(): void {
    this.mode = 'view';
    this.redesignatePrefill = null;
  }

  onFormContinue(event: {staff: DegreeGeneralAuthorityStaff; payload: DegreeGeneralAuthorityDesignationPayload}): void {
    this.pendingStaff = event.staff;
    this.pendingPayload = event.payload;
    this.confirmVisible = true;
  }

  confirmSubmit(): void {
    if (!this.pendingPayload || this.saving) {
      return;
    }
    this.saving = true;
    this.service.designateGeneralAuthority(this.roleKey, this.pendingPayload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.confirmVisible = false;
          this.mode = 'view';
          this.redesignatePrefill = null;
          this.audits = [];
          this.notifications.success('Datos generales', 'Autoridad actualizada correctamente.');
          this.load();
          this.changed.emit();
        },
        error: error => {
          this.confirmVisible = false;
          this.notifications.notifyApiData(error);
        },
      });
  }
}
