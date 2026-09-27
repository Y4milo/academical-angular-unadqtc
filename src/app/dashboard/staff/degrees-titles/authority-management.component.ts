import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {DatePipe, NgFor, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Avatar} from 'primeng/avatar';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {finalize} from 'rxjs';
import {
  DegreeGeneralAuthority,
  DegreeGeneralAuthorityDesignationPayload,
  DegreeGeneralAuthorityDictionaryRef,
  DegreeGeneralAuthorityRoleKey,
  DegreeGeneralAuthorityStaff,
  DegreesTitlesService,
} from '../../../services/degrees-titles.service';
import {NotificationService} from '../../../services/notification.service';
import {AuthorityDesignationFormComponent} from './authority-designation-form.component';
import {changeActionLabel, confirmActionLabel, designateActionLabel, displayName, initials, isResponsibleRole, maskDni, personLabel, roleTitle} from './degree-general-data.util';

type StatusFilter = 'all' | 'active' | 'previous';
type SortOrder = 'desc' | 'asc';

@Component({
  selector: 'app-authority-management',
  imports: [Avatar, AuthorityDesignationFormComponent, ButtonModule, DatePipe, DialogModule, FormsModule, InputTextModule, NgFor, NgIf, Select, TagModule],
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

  loading = false;
  history: DegreeGeneralAuthority[] = [];
  mode: 'view' | 'designate' = 'view';
  redesignatePrefill: DegreeGeneralAuthority | null = null;

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
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.getGeneralAuthorityHistory(this.roleKey)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: response => (this.history = response.data),
        error: error => this.notifications.notifyApiData(error),
      });
  }

  get current(): DegreeGeneralAuthority | null {
    return this.history.find(item => item.active) ?? null;
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
