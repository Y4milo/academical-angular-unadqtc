import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {NgFor, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Avatar} from 'primeng/avatar';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {MessageModule} from 'primeng/message';
import {Select} from 'primeng/select';
import {SkeletonModule} from 'primeng/skeleton';
import {StepperModule} from 'primeng/stepper';
import {TagModule} from 'primeng/tag';
import {finalize} from 'rxjs';
import {
  CoreAuthorityFields,
  CoreResolvedField,
  DegreeGeneralAuthority,
  DegreeGeneralAuthorityDesignationPayload,
  DegreeGeneralAuthorityDictionaryRef,
  DegreeGeneralAuthorityGenderStatus,
  DegreeGeneralAuthorityRoleKey,
  DegreeGeneralAuthorityStaff,
  DegreesTitlesService,
} from '../../../services/degrees-titles.service';
import {initials, INSTITUTIONAL_EMAIL_DOMAIN, isInstitutionalEmail} from './degree-general-data.util';

interface DesignationFormModel {
  professional_prefix_id: number | null;
  academic_title: string;
  short_role: string;
  document_phrase: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-authority-designation-form',
  imports: [Avatar, ButtonModule, FormsModule, InputTextModule, MessageModule, NgFor, NgIf, Select, SkeletonModule, StepperModule, TagModule],
  templateUrl: './authority-designation-form.component.html',
  styleUrl: './degree-general-data.shared.css',
})
export class AuthorityDesignationFormComponent implements OnChanges {
  @Input({required: true}) roleKey!: DegreeGeneralAuthorityRoleKey;
  @Input() prefixes: DegreeGeneralAuthorityDictionaryRef[] = [];
  @Input() prefill: DegreeGeneralAuthority | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() continueWith = new EventEmitter<{staff: DegreeGeneralAuthorityStaff; payload: DegreeGeneralAuthorityDesignationPayload}>();

  readonly initials = initials;
  readonly emailDomain = INSTITUTIONAL_EMAIL_DOMAIN;

  /** Paso del asistente: 1 Buscar persona, 2 Datos, 3 Confirmar. */
  step = 1;
  documentNumber = '';
  documentNumberTouched = false;
  searchingStaff = false;
  staffSearchStatus: 'found' | 'not_found' | 'invalid_document' | 'error' | null = null;
  foundStaff: DegreeGeneralAuthorityStaff | null = null;
  resolvedRoleLabel: string | null = null;
  genderStatus: DegreeGeneralAuthorityGenderStatus | null = null;
  coreFields: CoreAuthorityFields | null = null;
  form: DesignationFormModel = this.emptyForm();

  constructor(private readonly service: DegreesTitlesService) {}

  ngOnChanges(): void {
    this.step = 1;
    this.documentNumber = '';
    this.documentNumberTouched = false;
    this.staffSearchStatus = null;
    this.foundStaff = null;
    this.resolvedRoleLabel = null;
    this.genderStatus = null;
    this.coreFields = null;

    if (this.prefill) {
      this.form = {
        professional_prefix_id: this.prefill.professional_prefix?.id ?? null,
        academic_title: this.prefill.academic_title ?? '',
        short_role: this.prefill.short_role ?? '',
        document_phrase: this.prefill.document_phrase ?? '',
        email: this.prefill.email ?? '',
        phone: this.prefill.phone ?? '',
      };
      // Never reuse the historical role_label — re-resolve the person's CURRENT
      // gender from Core, since it may have changed since the original designation.
      this.documentNumber = this.prefill.staff.number;
      this.searchStaff();
    } else {
      this.form = this.emptyForm();
    }
  }

  get documentNumberInvalid(): boolean {
    return !/^\d{6,10}$/.test(this.documentNumber.trim());
  }

  searchStaff(): void {
    this.documentNumberTouched = true;
    if (this.documentNumberInvalid) {
      return;
    }

    this.searchingStaff = true;
    this.step = 1;
    this.staffSearchStatus = null;
    this.foundStaff = null;
    this.resolvedRoleLabel = null;
    this.genderStatus = null;
    this.coreFields = null;
    this.service.searchStaffByDocument(this.documentNumber.trim(), this.roleKey)
      .pipe(finalize(() => (this.searchingStaff = false)))
      .subscribe({
        next: response => {
          this.staffSearchStatus = response.data.status;
          this.foundStaff = response.data.staff;
          this.resolvedRoleLabel = response.data.role_label;
          this.genderStatus = response.data.gender_status;
          this.coreFields = response.data.core_fields ?? null;
          this.applyCoreValues();
          if (this.foundStaff) {
            this.step = 2;
          }
        },
        error: () => (this.staffSearchStatus = 'error'),
      });
  }

  changeStaff(): void {
    this.step = 1;
    this.foundStaff = null;
    this.staffSearchStatus = null;
    this.resolvedRoleLabel = null;
    this.genderStatus = null;
    this.coreFields = null;
    this.documentNumber = '';
    this.documentNumberTouched = false;
    this.form = this.emptyForm();
  }

  /** Un dato que entrega Core queda bloqueado y siempre gana; solo lo que Core no tiene se completa a mano. */
  isLocked(field: CoreResolvedField): boolean {
    return this.coreFields?.sources?.[field] === 'core';
  }

  /** Core respondió pero no tiene el dato: el usuario lo completa manualmente. */
  isManual(field: CoreResolvedField): boolean {
    return !!this.coreFields?.sources && this.coreFields.sources[field] !== 'core';
  }

  get coreUnavailable(): boolean {
    return this.coreFields?.status === 'technical_error';
  }

  get notInCore(): boolean {
    return this.coreFields?.status === 'not_in_core';
  }

  get emailCandidates(): string[] {
    return this.isManual('email') ? this.coreFields?.email_candidates ?? [] : [];
  }

  get emailInvalid(): boolean {
    return this.isManual('email') && this.form.email.trim() !== '' && !isInstitutionalEmail(this.form.email);
  }

  useEmailCandidate(email: string): void {
    this.form.email = email;
  }

  /** Resumen del paso 3: cada dato con su valor y de dónde viene. */
  get summaryRows(): {label: string; value: string | null; source: 'Core' | 'Manual' | null}[] {
    const prefix = this.prefixes.find(item => item.id === this.form.professional_prefix_id)?.label ?? null;
    const rows: {label: string; field: CoreResolvedField; value: string | null}[] = [
      {label: 'Prefijo profesional', field: 'professional_prefix_id', value: prefix},
      {label: 'Grado/Título académico', field: 'academic_title', value: this.form.academic_title.trim() || null},
      {label: 'Correo institucional', field: 'email', value: this.form.email.trim() || null},
      {label: 'Teléfono', field: 'phone', value: this.form.phone.trim() || null},
    ];

    return rows.map(row => ({
      label: row.label,
      value: row.value,
      source: this.isLocked(row.field) ? 'Core' : row.value ? 'Manual' : null,
    }));
  }

  goToSummary(): void {
    if (this.canContinue) {
      this.step = 3;
    }
  }

  get canContinue(): boolean {
    return this.foundStaff !== null && this.resolvedRoleLabel !== null && !this.coreUnavailable && !this.emailInvalid;
  }

  submit(): void {
    if (!this.canContinue || !this.foundStaff || !this.resolvedRoleLabel) {
      return;
    }
    this.continueWith.emit({
      staff: this.foundStaff,
      payload: {
        staff_id: this.foundStaff.id,
        professional_prefix_id: this.form.professional_prefix_id,
        academic_title: this.form.academic_title.trim() || null,
        short_role: this.form.short_role.trim() || null,
        document_phrase: this.form.document_phrase.trim() || null,
        email: this.form.email.trim() || null,
        phone: this.form.phone.trim() || null,
      },
    });
  }

  private applyCoreValues(): void {
    const values = this.coreFields?.values;
    if (!values) {
      return;
    }
    if (this.isLocked('professional_prefix_id')) this.form.professional_prefix_id = values.professional_prefix_id;
    if (this.isLocked('academic_title')) this.form.academic_title = values.academic_title ?? '';
    if (this.isLocked('email')) this.form.email = values.email ?? '';
    if (this.isLocked('phone')) this.form.phone = values.phone ?? '';
  }

  private emptyForm(): DesignationFormModel {
    return {professional_prefix_id: null, academic_title: '', short_role: '', document_phrase: '', email: '', phone: ''};
  }
}
