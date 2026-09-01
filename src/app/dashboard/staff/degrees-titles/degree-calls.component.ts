import {Component, OnInit} from '@angular/core';
import {DatePipe, NgIf} from '@angular/common';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {DatePicker} from 'primeng/datepicker';
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {MessageModule} from 'primeng/message';
import {Select} from 'primeng/select';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {STATUS} from '../../../core/constants/api-status.constants';
import {ROLE} from '../../../core/constants/app-roles.constants';
import {
  DegreeCall,
  DegreeCallPayload,
  DegreeCallStatusValue,
  DegreesTitlesService,
} from '../../../services/degrees-titles.service';
import {LoginService} from '../../../services/login.service';
import {NotificationService} from '../../../services/notification.service';
import {TestModeBannerComponent} from '../../../core/components/test-mode-banner.component';
import {PATHS} from '../../../core/constants/app-paths.constants';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-degree-calls',
  imports: [
    ButtonModule,
    CardModule,
    DatePipe,
    DatePicker,
    DialogModule,
    FormsModule,
    InputTextModule,
    MessageModule,
    NgIf,
    Select,
    TableModule,
    TagModule,
    TestModeBannerComponent,
  ],
  templateUrl: './degree-calls.component.html',
  styleUrl: './degree-calls.component.css',
})
export class DegreeCallsComponent implements OnInit {
  readonly statusOptions: SelectOption[] = [
    {label: 'Todos', value: ''},
    {label: 'Borrador', value: 'draft'},
    {label: 'Abierta', value: 'open'},
    {label: 'Cerrada', value: 'closed'},
    {label: 'Exportada', value: 'exported'},
    {label: 'Anulada', value: 'annulled'},
  ];

  calls: DegreeCall[] = [];
  search = '';
  status = '';
  page = 1;
  perPage = 15;
  total = 0;
  loading = false;
  saving = false;
  actionId: number | null = null;
  formVisible = false;
  formAttempted = false;
  editingCall: DegreeCall | null = null;
  reopenAfterSave = false;
  form = this.emptyForm();
  mailTestMode = false;
  mailTestRecipient: string | null = null;

  constructor(
    private degreesTitlesService: DegreesTitlesService,
    private loginService: LoginService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.degreesTitlesService.getRecordCatalogs().subscribe({next: response => {
      this.mailTestMode = response.data.mail_delivery.test_mode;
      this.mailTestRecipient = response.data.mail_delivery.test_recipient;
    }});
    this.loadCalls();
  }

  get isAdmin(): boolean {
    return this.loginService.getUser()?.role?.value === ROLE.admin;
  }

  loadCalls(page = 1): void {
    this.page = page;
    this.loading = true;
    this.degreesTitlesService.listCalls({
      search: this.search.trim(),
      status: this.status,
      page,
      per_page: this.perPage,
    }).subscribe({
      next: response => {
        this.loading = false;
        this.calls = response.data ?? [];
        this.total = response.meta?.total ?? 0;
        this.page = response.meta?.current_page ?? page;
      },
      error: error => {
        this.loading = false;
        this.notificationService.notifyApiData(error);
      },
    });
  }

  clearFilters(): void {
    this.search = '';
    this.status = '';
    this.loadCalls(1);
  }

  onPageChange(event: {first?: number; rows?: number}): void {
    this.perPage = event.rows ?? this.perPage;
    const first = event.first ?? 0;
    this.loadCalls(Math.floor(first / this.perPage) + 1);
  }

  openCreate(): void {
    this.editingCall = null;
    this.reopenAfterSave = false;
    this.formAttempted = false;
    this.form = this.emptyForm();
    this.formVisible = true;
  }

  openEdit(call: DegreeCall, reopenAfterSave = false): void {
    if (!this.canEdit(call)) {
      return;
    }

    this.editingCall = call;
    this.reopenAfterSave = reopenAfterSave;
    this.formAttempted = false;
    this.form = {
      name: call.name,
      resolution_number: call.resolution_number ?? '',
      resolution_date: this.parseDate(call.resolution_date),
    };
    this.formVisible = true;
  }

  save(): void {
    this.formAttempted = true;
    const name = this.form.name.trim();
    if (!name) {
      this.notificationService.warning('Datos incompletos', 'El nombre de la convocatoria es obligatorio.');
      return;
    }

    if (this.isResolutionOnlyEdit() && (!this.form.resolution_number.trim() || !this.form.resolution_date)) {
      this.notificationService.warning(
        'Datos incompletos',
        'El nombre, el número y la fecha de resolución son obligatorios para completar la convocatoria.',
      );
      return;
    }

    const payload: DegreeCallPayload = {
      name,
      resolution_number: this.form.resolution_number.trim() || null,
      resolution_date: this.formatDate(this.form.resolution_date),
    };
    const request = this.editingCall
      ? this.degreesTitlesService.updateCall(this.editingCall.id, payload)
      : this.degreesTitlesService.createCall(payload);

    this.saving = true;
    request.subscribe({
      next: response => {
        this.saving = false;
        if (response.status === STATUS.success) {
          const callToReopen = this.reopenAfterSave ? response.payload.data : null;
          this.formVisible = false;
          this.formAttempted = false;
          this.reopenAfterSave = false;

          if (callToReopen) {
            this.runAction(callToReopen, () => this.degreesTitlesService.openCall(callToReopen.id));
            return;
          }

          this.notificationService.success(
            this.editingCall ? 'Convocatoria actualizada' : 'Convocatoria creada',
            response.payload.message,
          );
          this.loadCalls(this.editingCall ? this.page : 1);
          return;
        }
        this.notificationService.notifyApiData(response);
      },
      error: error => {
        this.saving = false;
        this.notificationService.notifyApiData(error);
      },
    });
  }

  openCall(call: DegreeCall): void {
    if (!call.name?.trim() || !call.resolution_number?.trim() || !call.resolution_date) {
      this.openEdit(call, true);
      this.notificationService.warning(
        'Complete la convocatoria',
        'Registre el nombre, el número y la fecha de resolución antes de abrir o reabrir.',
      );
      return;
    }

    const verb = call.status.value === 'draft' ? 'abrir' : 'reabrir';
    if (!confirm(`¿Desea ${verb} la convocatoria “${call.name}”?`)) {
      return;
    }
    this.runAction(call, () => this.degreesTitlesService.openCall(call.id));
  }

  closeCall(call: DegreeCall): void {
    if (!confirm(`¿Desea cerrar la convocatoria “${call.name}”? Después no podrá editarse.`)) {
      return;
    }
    this.runAction(call, () => this.degreesTitlesService.closeCall(call.id));
  }

  annulCall(call: DegreeCall): void {
    if (!confirm(`¿Desea anular la convocatoria “${call.name}”? Los datos no serán eliminados.`)) {
      return;
    }
    this.runAction(call, () => this.degreesTitlesService.annulCall(call.id));
  }

  canEdit(call: DegreeCall): boolean {
    return ['draft', 'open'].includes(call.status.value)
      || (this.isAdmin && ['closed', 'exported'].includes(call.status.value));
  }

  isResolutionOnlyEdit(): boolean {
    return !!this.editingCall && ['closed', 'exported'].includes(this.editingCall.status.value);
  }

  canOpen(call: DegreeCall): boolean {
    return call.status.value === 'draft' || (this.isAdmin && ['closed', 'exported'].includes(call.status.value));
  }

  canClose(call: DegreeCall): boolean {
    return call.status.value === 'open';
  }

  canAnnul(call: DegreeCall): boolean {
    return ['draft', 'open'].includes(call.status.value)
      || (this.isAdmin && ['closed', 'exported'].includes(call.status.value));
  }

  canViewRecords(call: DegreeCall): boolean {
    return call.status.value !== 'draft'
      && (call.status.value !== 'annulled' || call.records_count > 0);
  }

  recordsActionLabel(call: DegreeCall): string {
    return call.status.value === 'open' ? 'Gestionar padrón' : 'Ver padrón';
  }

  goToRecords(call: DegreeCall): void {
    if (!this.canViewRecords(call)) return;

    const route = this.isAdmin
      ? PATHS.admin.degreesTitles.records.link
      : PATHS.degreesTitles.records.link;
    this.router.navigate([route], {queryParams: {call_id: call.id}});
  }

  statusSeverity(status: DegreeCallStatusValue): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<DegreeCallStatusValue, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      draft: 'secondary',
      open: 'success',
      closed: 'warn',
      exported: 'info',
      annulled: 'danger',
    };
    return map[status];
  }

  formStatusMessageSeverity(): 'success' | 'info' | 'warn' | 'error' | 'secondary' {
    if (!this.editingCall) return 'secondary';

    const map: Record<DegreeCallStatusValue, 'success' | 'info' | 'warn' | 'error' | 'secondary'> = {
      draft: 'secondary',
      open: 'success',
      closed: 'warn',
      exported: 'info',
      annulled: 'error',
    };
    return map[this.editingCall.status.value];
  }

  formStatusDescription(): string {
    if (!this.editingCall) {
      return 'La convocatoria se guardará inicialmente como borrador.';
    }
    if (this.reopenAfterSave) {
      return 'Al guardar los datos obligatorios, la convocatoria se reabrirá automáticamente.';
    }

    const descriptions: Record<DegreeCallStatusValue, string> = {
      draft: 'Complete los datos y utilice la acción Abrir cuando corresponda.',
      open: 'La convocatoria está habilitada para gestionar su padrón de aptos.',
      closed: 'La convocatoria está cerrada y su padrón permanece en modo consulta.',
      exported: 'La convocatoria ya fue exportada y su padrón permanece en modo consulta.',
      annulled: 'La convocatoria está anulada y se conserva únicamente para auditoría.',
    };
    return descriptions[this.editingCall.status.value];
  }

  private runAction(call: DegreeCall, action: () => ReturnType<DegreesTitlesService['openCall']>): void {
    this.actionId = call.id;
    action().subscribe({
      next: response => {
        this.actionId = null;
        if (response.status === STATUS.success) {
          this.notificationService.success('Estado actualizado', response.payload.message);
          this.loadCalls(this.page);
          return;
        }
        this.notificationService.notifyApiData(response);
      },
      error: error => {
        this.actionId = null;
        this.notificationService.notifyApiData(error);
      },
    });
  }

  private emptyForm(): {name: string; resolution_number: string; resolution_date: Date | null} {
    return {name: '', resolution_number: '', resolution_date: null};
  }

  private parseDate(value: string | null): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(value: Date | null): string | null {
    if (!value) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
