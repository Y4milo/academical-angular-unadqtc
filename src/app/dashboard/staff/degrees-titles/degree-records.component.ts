import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DatePipe, NgFor, NgIf} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {TooltipModule} from 'primeng/tooltip';
import {InputTextModule} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {DatePicker} from 'primeng/datepicker';
import {ListboxModule} from 'primeng/listbox';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ConfirmationService} from 'primeng/api';
import {InputNumberModule} from 'primeng/inputnumber';
import {FieldsetModule} from 'primeng/fieldset';
import {MessageModule} from 'primeng/message';
import {STATUS} from '../../../core/constants/api-status.constants';
import {
  DegreeCatalogOption,
  DegreeAcademicCareer,
  DegreeAcademicDenomination,
  DegreeAcademicFaculty,
  DegreeAcademicProgram,
  DegreeRecord,
  DegreeRecordPayload,
  DegreeStudent,
  InstitutionalIdentityLookup,
  DegreesTitlesService,
} from '../../../services/degrees-titles.service';
import {NotificationService} from '../../../services/notification.service';

@Component({
  selector: 'app-degree-records',
  standalone: true,
  imports: [
    FormsModule, DatePipe, NgFor, NgIf, ButtonModule, DialogModule, TableModule, TagModule, TooltipModule,
    InputTextModule, Select, DatePicker, ListboxModule, ConfirmDialogModule, InputNumberModule, FieldsetModule, MessageModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './degree-records.component.html',
  styleUrl: './degree-records.component.css',
})
export class DegreeRecordsComponent implements OnInit {
  readonly genderOptions = [{label: 'Masculino', value: 'M'}, {label: 'Femenino', value: 'F'}];
  readonly suneduGroups = [
    {legend: 'Información académica', fields: [
      this.field('ESC_POS', 'Escuela de posgrado'), this.dateField('MATRI_FEC', 'Fecha de matrícula'),
      this.dateField('EGRES_FEC', 'Fecha de egreso'), this.field('PROC_BACH', 'Procedencia del bachiller'),
      this.field('PROC_INST_ORIG', 'Institución de origen'), this.field('PROC_TITULO_PED', 'Título pedagógico de procedencia'),
      this.field('PROG_ESTU', 'Programa de estudios'), this.numberField('NUM_CRED', 'Número de créditos'),
      this.field('MOD_OBT', 'Modalidad de obtención'),
      this.selectField('MOD_EST', 'Modalidad de estudios', [
        {label: 'Presencial', value: 'P'}, {label: 'Semipresencial', value: 'S'}, {label: 'A distancia', value: 'D'},
      ]),
    ]},
    {legend: 'Investigación y sustentación', fields: [
      this.field('REG_METADATO', 'Registro de metadatos'), this.field('TRAB_INV', 'Trabajo de investigación'),
      this.selectField('REQ_IDM', 'Requisito de idioma', this.yesNoOptions()),
      this.field('PROG_ACREDIT', 'Programa acreditado'), this.dateField('FEC_INICIO_ACREDIT', 'Inicio de acreditación'),
      this.dateField('FEC_FIN_ACREDIT', 'Fin de acreditación'), this.dateField('FEC_INI_TRA_TIT', 'Inicio del trámite'),
      this.selectField('TRAB_INVEST_ORIGINAL', 'Trabajo original', this.yesNoOptions()),
      this.field('MEC_UTI', 'Mecanismo utilizado'), this.field('DEP_VER_ORIG', 'Dependencia que verificó originalidad'),
      this.field('MOD_SUSTENTACION', 'Modalidad de sustentación'),
    ]},
    {legend: 'Revalidación y procedencia extranjera', fields: [
      this.field('PROC_REV_PAIS', 'País de revalidación'), this.field('PROC_REV_UNIV', 'Universidad de revalidación'),
      this.field('PROC_REV_GRADO', 'Grado revalidado'), this.field('CRIT_REV', 'Criterio de revalidación'),
      this.field('PROC_PAIS_EXT', 'País de procedencia extranjera'),
      this.field('PROC_UNIV_EXT', 'Universidad extranjera'), this.field('PROC_GRADO_EXT', 'Grado extranjero'),
    ]},
    {legend: 'Duplicados, oficio y modificaciones', fields: [
      this.field('RESO_NUM_DUP_NUE', 'Nueva resolución de duplicado'),
      this.dateField('RESO_FEC_DUP_NUE', 'Fecha de resolución de duplicado'),
      this.dateField('DIPL_FEC_DUP_NUE', 'Fecha del diploma duplicado'), this.field('REG_OFICIO', 'Número de oficio'),
      this.dateField('FEC_MAT_MOD', 'Fecha de matrícula modificada'),
      this.dateField('FEC_INICIO_MOD', 'Inicio de modificación'), this.dateField('FEC_FIN_MOD', 'Fin de modificación'),
    ]},
  ];
  records: DegreeRecord[] = [];
  calls: DegreeCatalogOption[] = [];
  degreeTypes: DegreeCatalogOption[] = [];
  issueTypes: DegreeCatalogOption[] = [];
  academicTree: DegreeAcademicFaculty[] = [];
  suneduSchemaVersion = '';
  mailTestMode = false;
  mailTestRecipient: string | null = null;
  students: DegreeStudent[] = [];
  selectedStudent: DegreeStudent | null = null;
  selectedCallId: number | null = null;
  search = '';
  studentSearch = '';
  page = 1;
  perPage = 15;
  total = 0;
  loading = false;
  searchingStudents = false;
  studentIdentityChecking = false;
  studentIdentityResult: InstitutionalIdentityLookup | null = null;
  saving = false;
  dialogVisible = false;
  editing: DegreeRecord | null = null;
  linkDialogVisible = false;
  generatedLink = '';
  generatedLinkExpiresAt: string | null = null;
  generatingLinkId: number | null = null;
  identityDialogVisible = false;
  identityLookup: InstitutionalIdentityLookup | null = null;
  identityRecord: DegreeRecord | null = null;
  checkingIdentityId: number | null = null;
  confirmingIdentity = false;
  sendingEmailId: number | null = null;
  form = this.emptyForm();

  constructor(
    private service: DegreesTitlesService,
    private notifications: NotificationService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadRecords();
  }

  loadCatalogs(): void {
    this.service.getRecordCatalogs().subscribe({
      next: response => {
        this.calls = response.data.open_calls ?? [];
        this.degreeTypes = (response.data.degree_types ?? [])
          .filter(type => ['bachelor', 'professional_title'].includes(type.value ?? ''));
        this.issueTypes = response.data.diploma_issue_types ?? [];
        this.academicTree = response.data.academic_tree ?? [];
        this.suneduSchemaVersion = response.data.sunedu_schema?.version ?? '';
        this.mailTestMode = response.data.mail_delivery?.test_mode ?? false;
        this.mailTestRecipient = response.data.mail_delivery?.test_recipient ?? null;
      },
      error: error => this.notifications.notifyApiData(error),
    });
  }

  loadRecords(page = 1): void {
    this.loading = true;
    this.service.listRecords({call_id: this.selectedCallId, search: this.search.trim(), page, per_page: this.perPage})
      .subscribe({
        next: response => {
          this.loading = false;
          this.records = response.data ?? [];
          this.total = response.meta?.total ?? 0;
          this.page = response.meta?.current_page ?? page;
        },
        error: error => {
          this.loading = false;
          this.notifications.notifyApiData(error);
        },
      });
  }

  onPageChange(event: {first?: number; rows?: number}): void {
    this.perPage = event.rows ?? this.perPage;
    this.loadRecords(Math.floor((event.first ?? 0) / this.perPage) + 1);
  }

  clearFilters(): void {
    this.search = '';
    this.selectedCallId = null;
    this.loadRecords(1);
  }

  openCreate(): void {
    if (!this.calls.length) {
      this.notifications.warning('Sin convocatoria abierta', 'Abra una convocatoria antes de registrar estudiantes aptos.');
      return;
    }
    this.editing = null;
    this.selectedStudent = null;
    this.students = [];
    this.studentSearch = '';
    this.studentIdentityResult = null;
    this.form = this.emptyForm();
    this.form.degree_call_id = this.selectedCallId ?? this.calls[0].id;
    this.form.diploma_issue_type_id = this.issueTypes[0]?.id ?? null;
    this.dialogVisible = true;
  }

  openEdit(record: DegreeRecord): void {
    if (record.call?.status?.value !== 'open' || record.status?.value === 'annulled') return;
    this.editing = record;
    this.selectedStudent = null;
    this.studentIdentityResult = null;
    this.form = {
      degree_call_id: record.degree_call_id,
      student_id: record.student_id,
      degree_type_id: record.degree_type.id,
      gender: record.gender === 'F' ? 'F' : record.gender === 'M' ? 'M' : null,
      diploma_issue_type_id: record.diploma_issue_type?.id ?? null,
      faculty_id: record.faculty_id ?? this.findFacultyId(record.faculty),
      professional_career_id: record.professional_career_id ?? this.findCareerId(record.major),
      degree_program_id: record.degree_program_id ?? this.findProgramId(record.specialty),
      degree_denomination_id: record.degree_denomination_id ?? this.findDenominationId(record.degree_denomination),
      resolution_number: record.resolution_number ?? '', resolution_date: this.parseDate(record.resolution_date),
      diploma_number: record.diploma_number ?? '', diploma_date: this.parseDate(record.diploma_date),
      registry_book: record.registry_book ?? '', registry_folio: record.registry_folio ?? '',
      registry_number: record.registry_number ?? '',
      sunedu_data: this.manualSuneduData(record.sunedu_data ?? {}),
    };
    this.dialogVisible = true;
  }

  findStudents(): void {
    const term = this.studentSearch.trim();
    if (term.length < 2) {
      this.notifications.warning('Búsqueda incompleta', 'Ingrese al menos dos caracteres.');
      return;
    }
    this.searchingStudents = true;
    this.service.searchStudents(term).subscribe({
      next: response => { this.searchingStudents = false; this.students = response.data ?? []; },
      error: error => { this.searchingStudents = false; this.notifications.notifyApiData(error); },
    });
  }

  chooseStudent(student: DegreeStudent): void {
    this.selectedStudent = student;
    this.form.student_id = student.id;
    this.form.faculty_id = student.faculty?.id ?? null;
    this.form.professional_career_id = student.career?.id ?? null;
    this.form.degree_program_id = student.program?.id ?? null;
    this.form.degree_denomination_id = null;
    const gender = (student.gender ?? '').toLowerCase();
    this.form.gender = gender.startsWith('f') || gender.includes('mujer') ? 'F' : gender ? 'M' : null;
    this.students = [];
    this.applyDefaultProgram();
    this.syncDenomination();
    if (!['verified', 'confirmed', 'test'].includes(student.institutional_email_status ?? 'pending')) {
      this.verifySelectedStudent();
    }
  }

  get careers(): DegreeAcademicCareer[] {
    return this.academicTree.find(faculty => faculty.id === this.form.faculty_id)?.careers ?? [];
  }

  get selectedCareer(): DegreeAcademicCareer | null {
    return this.careers.find(career => career.id === this.form.professional_career_id) ?? null;
  }

  get specialtyPrograms(): DegreeAcademicProgram[] {
    return (this.selectedCareer?.programs ?? []).filter(program => !!program.specialty);
  }

  get requiresSpecialty(): boolean {
    return this.selectedCareer?.requires_specialty ?? false;
  }

  get selectedDenomination(): DegreeAcademicDenomination | null {
    return this.selectedCareer?.denominations.find(option => option.id === this.form.degree_denomination_id) ?? null;
  }

  get selectedInstitutionalEmail(): string {
    return this.studentIdentityResult?.institutional_email
      ?? this.selectedStudent?.institutional_email
      ?? this.editing?.institutional_identity?.institutional_email
      ?? 'Correo institucional no registrado';
  }

  get currentStudentIdentityStatus(): string {
    return this.studentIdentityResult?.status
      ?? this.selectedStudent?.institutional_email_status
      ?? this.editing?.institutional_identity?.status
      ?? 'pending';
  }

  get canVerifyCurrentInstitutionalEmail(): boolean {
    if (this.selectedStudent) return this.canVerifyInstitutionalStatus(this.currentStudentIdentityStatus);
    return this.editing ? this.canVerifyInstitutionalEmail(this.editing) : false;
  }

  get currentInstitutionalEmailActionLabel(): string {
    return this.institutionalEmailActionForStatus(this.currentStudentIdentityStatus);
  }

  verifySelectedStudent(): void {
    if (!this.selectedStudent || this.selectedStudent.institutional_email_status === 'test') return;
    this.studentIdentityChecking = true;
    this.service.checkStudentInstitutionalIdentity(this.selectedStudent.id).subscribe({
      next: response => {
        this.studentIdentityChecking = false;
        if (response.status !== STATUS.success) return this.notifications.notifyApiData(response);
        const data = response.payload.data as InstitutionalIdentityLookup;
        this.studentIdentityResult = data;
        this.selectedStudent!.institutional_email = data.institutional_email ?? this.selectedStudent!.institutional_email;
        this.selectedStudent!.institutional_email_status = data.status ?? this.selectedStudent!.institutional_email_status;
        this.selectedStudent!.institutional_email_verified = data.status === 'verified';
      },
      error: error => {
        this.studentIdentityChecking = false;
        this.notifications.notifyApiData(error);
      },
    });
  }

  verifyCurrentInstitutionalEmail(): void {
    if (this.selectedStudent) {
      this.verifySelectedStudent();
      return;
    }
    if (this.editing) this.checkInstitutionalIdentity(this.editing);
  }

  onFacultyChange(): void {
    this.form.professional_career_id = null;
    this.form.degree_program_id = null;
    this.form.degree_denomination_id = null;
  }

  onCareerChange(): void {
    this.form.degree_program_id = null;
    this.form.degree_denomination_id = null;
    this.applyDefaultProgram();
    this.syncDenomination();
  }

  onDegreeTypeChange(): void {
    this.syncDenomination();
  }

  private applyDefaultProgram(): void {
    if (!this.requiresSpecialty) {
      this.form.degree_program_id = this.selectedCareer?.programs[0]?.id ?? null;
    }
  }

  private syncDenomination(): void {
    this.form.degree_denomination_id = this.selectedCareer?.denominations
      .find(option => option.degree_type_id === this.form.degree_type_id)?.id ?? null;
  }

  save(): void {
    if (!this.editing && (!this.form.degree_call_id || !this.form.student_id)) {
      this.notifications.warning('Datos incompletos', 'Seleccione la convocatoria y el estudiante.');
      return;
    }
    if (!this.form.degree_type_id || !this.form.faculty_id || !this.form.professional_career_id
      || !this.form.degree_denomination_id || (this.requiresSpecialty && !this.form.degree_program_id)) {
      this.notifications.warning('Datos académicos incompletos', 'Seleccione una combinación válida de facultad, carrera, grado y especialidad.');
      return;
    }
    const payload: DegreeRecordPayload = {
      ...this.form,
      resolution_date: this.formatDate(this.form.resolution_date),
      diploma_date: this.formatDate(this.form.diploma_date),
      sunedu_data: this.serialiseSuneduData(this.form.sunedu_data),
    };
    const request = this.editing
      ? this.service.updateRecord(this.editing.id, payload)
      : this.service.createRecord(payload);
    this.saving = true;
    request.subscribe({
      next: response => {
        this.saving = false;
        if (response.status === STATUS.success) {
          this.dialogVisible = false;
          this.notifications.success('Padrón actualizado', response.payload.message);
          this.loadRecords(this.page);
          return;
        }
        this.notifications.notifyApiData(response);
      },
      error: error => { this.saving = false; this.notifications.notifyApiData(error); },
    });
  }

  annul(record: DegreeRecord): void {
    this.confirmationService.confirm({
      header: 'Anular registro',
      message: `¿Desea anular el registro de ${record.full_name}? Se conservará para auditoría.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {severity: 'danger'},
      accept: () => this.service.annulRecord(record.id).subscribe({
        next: response => {
          if (response.status === STATUS.success) {
            this.notifications.success('Registro anulado', response.payload.message);
            this.loadRecords(this.page);
            return;
          }
          this.notifications.notifyApiData(response);
        },
        error: error => this.notifications.notifyApiData(error),
      }),
    });
  }

  canModify(record: DegreeRecord): boolean {
    return record.call?.status?.value === 'open' && record.status?.value !== 'annulled';
  }

  canVerifyInstitutionalEmail(record: DegreeRecord): boolean {
    return record.status?.value !== 'annulled'
      && this.canVerifyInstitutionalStatus(record.institutional_identity?.status);
  }

  isInstitutionalEmailVerified(record: DegreeRecord): boolean {
    return ['verified', 'confirmed'].includes(record.institutional_identity?.status ?? '');
  }

  institutionalEmailActionLabel(record: DegreeRecord): string {
    return this.institutionalEmailActionForStatus(record.institutional_identity?.status);
  }

  generateEthnicityLink(record: DegreeRecord): void {
    this.generatingLinkId = record.id;
    this.service.createEthnicityLink(record.id).subscribe({
      next: response => {
        this.generatingLinkId = null;
        if (response.status !== STATUS.success) return this.notifications.notifyApiData(response);
        this.generatedLink = response.payload.data.url;
        this.generatedLinkExpiresAt = response.payload.data.expires_at;
        this.linkDialogVisible = true;
        this.loadRecords(this.page);
      },
      error: error => { this.generatingLinkId = null; this.notifications.notifyApiData(error); },
    });
  }

  copyGeneratedLink(): void {
    navigator.clipboard.writeText(this.generatedLink).then(
      () => this.notifications.success('Enlace copiado', 'Ya puede enviarlo al estudiante.'),
      () => this.notifications.warning('No se pudo copiar', 'Seleccione el enlace y cópielo manualmente.'),
    );
  }

  checkInstitutionalIdentity(record: DegreeRecord): void {
    this.checkingIdentityId = record.id;
    this.identityLookup = null;
    this.service.checkInstitutionalIdentity(record.id).subscribe({
      next: response => {
        this.checkingIdentityId = null;
        if (response.status !== STATUS.success) return this.notifications.notifyApiData(response);
        this.identityRecord = record;
        this.identityLookup = response.payload.data;
        this.identityDialogVisible = true;
        this.loadRecords(this.page);
      },
      error: error => { this.checkingIdentityId = null; this.notifications.notifyApiData(error); },
    });
  }

  confirmInstitutionalIdentity(): void {
    if (!this.identityRecord) return;
    this.confirmingIdentity = true;
    this.service.confirmInstitutionalIdentity(this.identityRecord.id).subscribe({
      next: response => {
        this.confirmingIdentity = false;
        if (response.status !== STATUS.success) return this.notifications.notifyApiData(response);
        this.identityLookup = response.payload.data;
        this.notifications.success('Correo institucional', response.payload.message);
        this.loadRecords(this.page);
      },
      error: error => { this.confirmingIdentity = false; this.notifications.notifyApiData(error); },
    });
  }

  identitySeverity(status?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return ['verified', 'confirmed'].includes(status ?? '') ? 'success' : status === 'probable' ? 'info' :
      ['review_required', 'pending'].includes(status ?? '') ? 'warn' :
        ['not_match', 'not_found', 'invalid_domain'].includes(status ?? '') ? 'danger' : 'secondary';
  }

  identityLabel(status?: string): string {
    return ({verified: 'Verificado 100% con Microsoft 365', confirmed: 'Coincidencia confirmada', probable: 'Coincidencia probable',
      review_required: 'Requiere revisión', not_match: 'No corresponde', not_found: 'Cuenta institucional no encontrada',
      pending: 'Pendiente de verificación', test: 'Correo de prueba', invalid_domain: 'Dominio no institucional'} as Record<string, string>)[status ?? ''] ?? 'Sin verificar';
  }

  private canVerifyInstitutionalStatus(status?: string | null): boolean {
    return ['pending', 'not_found', 'probable', 'review_required', 'not_match', 'invalid_domain']
      .includes(status ?? 'pending');
  }

  private institutionalEmailActionForStatus(status?: string | null): string {
    return ({
      pending: 'Verificar correo institucional',
      not_found: 'Volver a buscar en Microsoft 365',
      probable: 'Revisar identidad institucional',
      review_required: 'Revisar identidad institucional',
      not_match: 'Revisar correo institucional',
      invalid_domain: 'Corregir correo institucional',
    } as Record<string, string>)[status ?? 'pending'] ?? 'Verificar correo institucional';
  }

  sendEthnicityEmail(record: DegreeRecord): void {
    this.sendingEmailId = record.id;
    this.service.sendEthnicityFormEmail(record.id).subscribe({
      next: response => {
        this.sendingEmailId = null;
        if (response.status !== STATUS.success) return this.notifications.notifyApiData(response);
        const detail = response.payload.data.test_mode
          ? `${response.payload.message} Modo de prueba: enviado a ${response.payload.data.recipient}.`
          : `${response.payload.message} Destinatario: ${response.payload.data.recipient}.`;
        this.notifications.success('Correo enviado', detail);
        this.loadRecords(this.page);
      },
      error: error => { this.sendingEmailId = null; this.notifications.notifyApiData(error); },
    });
  }

  private emptyForm(): any {
    return {
      degree_call_id: null, student_id: null, degree_type_id: null, diploma_issue_type_id: null,
      gender: null,
      faculty_id: null, professional_career_id: null, degree_program_id: null, degree_denomination_id: null,
      resolution_number: '',
      resolution_date: null, diploma_number: '', diploma_date: null, registry_book: '',
      registry_folio: '', registry_number: '',
      sunedu_data: {},
    };
  }

  private parseDate(value: string | null): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(value: Date | string | null): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private manualSuneduData(data: Record<string, string | number | null>): Record<string, any> {
    const result: Record<string, any> = {};
    this.suneduGroups.flatMap(group => group.fields).forEach(field => {
      const value = data[field.key] ?? null;
      result[field.key] = field.type === 'date' && typeof value === 'string' ? this.parseDate(value) : value;
    });
    return result;
  }

  private serialiseSuneduData(data: Record<string, any>): Record<string, string | number | null> {
    const result: Record<string, string | number | null> = {};
    this.suneduGroups.flatMap(group => group.fields).forEach(field => {
      const value = data?.[field.key] ?? null;
      result[field.key] = field.type === 'date' ? this.formatDate(value) : value;
    });
    return result;
  }

  private field(key: string, label: string): any { return {key, label, type: 'text'}; }
  private dateField(key: string, label: string): any { return {key, label, type: 'date'}; }
  private numberField(key: string, label: string): any { return {key, label, type: 'number'}; }
  private selectField(key: string, label: string, options: any[]): any { return {key, label, type: 'select', options}; }
  private yesNoOptions(): any[] { return [{label: 'Sí', value: 'SI'}, {label: 'No', value: 'NO'}]; }

  private findFacultyId(label: string | null): number | null {
    return this.academicTree.find(option => option.label === label)?.id ?? null;
  }

  private findCareerId(label: string | null): number | null {
    return this.academicTree.flatMap(option => option.careers).find(option => option.label === label)?.id ?? null;
  }

  private findProgramId(specialty: string | null): number | null {
    return this.academicTree.flatMap(option => option.careers).flatMap(option => option.programs)
      .find(option => option.specialty === specialty)?.id ?? null;
  }

  private findDenominationId(label: string | null): number | null {
    return this.academicTree.flatMap(option => option.careers).flatMap(option => option.denominations)
      .find(option => option.label === label)?.id ?? null;
  }
}
