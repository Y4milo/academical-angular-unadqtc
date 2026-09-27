import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Avatar} from 'primeng/avatar';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {MessageModule} from 'primeng/message';
import {Select} from 'primeng/select';
import {finalize} from 'rxjs';
import {
  DegreeGeneralAuthority,
  DegreeGeneralAuthorityDesignationPayload,
  DegreeGeneralAuthorityDictionaryRef,
  DegreeGeneralAuthorityGenderStatus,
  DegreeGeneralAuthorityRoleKey,
  DegreeGeneralAuthorityStaff,
  DegreesTitlesService,
} from '../../../services/degrees-titles.service';
import {initials} from './degree-general-data.util';

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
  imports: [Avatar, ButtonModule, FormsModule, InputTextModule, MessageModule, NgIf, Select],
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

  documentNumber = '';
  documentNumberTouched = false;
  searchingStaff = false;
  staffSearchStatus: 'found' | 'not_found' | 'invalid_document' | 'error' | null = null;
  foundStaff: DegreeGeneralAuthorityStaff | null = null;
  resolvedRoleLabel: string | null = null;
  genderStatus: DegreeGeneralAuthorityGenderStatus | null = null;
  form: DesignationFormModel = this.emptyForm();

  constructor(private readonly service: DegreesTitlesService) {}

  ngOnChanges(): void {
    this.documentNumber = '';
    this.documentNumberTouched = false;
    this.staffSearchStatus = null;
    this.foundStaff = null;
    this.resolvedRoleLabel = null;
    this.genderStatus = null;

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
    this.staffSearchStatus = null;
    this.foundStaff = null;
    this.resolvedRoleLabel = null;
    this.genderStatus = null;
    this.service.searchStaffByDocument(this.documentNumber.trim(), this.roleKey)
      .pipe(finalize(() => (this.searchingStaff = false)))
      .subscribe({
        next: response => {
          this.staffSearchStatus = response.data.status;
          this.foundStaff = response.data.staff;
          this.resolvedRoleLabel = response.data.role_label;
          this.genderStatus = response.data.gender_status;
        },
        error: () => (this.staffSearchStatus = 'error'),
      });
  }

  changeStaff(): void {
    this.foundStaff = null;
    this.staffSearchStatus = null;
    this.resolvedRoleLabel = null;
    this.genderStatus = null;
    this.documentNumber = '';
    this.documentNumberTouched = false;
    this.form = this.emptyForm();
  }

  get canContinue(): boolean {
    return this.foundStaff !== null && this.resolvedRoleLabel !== null;
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

  private emptyForm(): DesignationFormModel {
    return {professional_prefix_id: null, academic_title: '', short_role: '', document_phrase: '', email: '', phone: ''};
  }
}
