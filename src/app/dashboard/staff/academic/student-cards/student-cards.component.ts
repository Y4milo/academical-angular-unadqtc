import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {StudentCard} from '../../../../models/student/student-card.model';
import {AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {StudentCardService} from '../../../../services/student-card.service';
import {NotificationService} from '../../../../services/notification.service';
import {CardModule} from 'primeng/card';
import {TabViewModule} from 'primeng/tabview';
import {ButtonModule} from 'primeng/button';
import {BadgeModule} from 'primeng/badge';
import {TooltipModule} from 'primeng/tooltip';
import {MultiSelect, MultiSelectModule} from 'primeng/multiselect';
import {OverlayPanel, OverlayPanelModule} from 'primeng/overlaypanel';
import {DictionaryService} from '../../../../services/dictionary.service';
import {Dictionary} from '../../../../models/dictionary.model';
import {PopoverModule} from 'primeng/popover';
import {FileUpload, FileUploadModule} from 'primeng/fileupload';
import {ApiData} from '../../../../models/api/api-data.model';
import {STATUS} from '../../../../core/constants/status';
import {NOTIFICATION_MESSAGE} from '../../../../core/constants/notification_message';
import {DialogModule} from 'primeng/dialog';
import {CheckboxModule} from 'primeng/checkbox';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {HttpResponse} from '@angular/common/http';
import {StudentFileType} from '../../../../core/constants/api/student_cards';
import {InputTextModule} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {CommonModule} from '@angular/common';
import {TagModule} from 'primeng/tag';
import {ImageModule} from 'primeng/image';
import {ToolbarModule} from 'primeng/toolbar';
import {validatePhotoCardStudent} from '../../../../helper/helper.util';
import {StepsModule} from 'primeng/steps';

@Component({
  selector: 'app-student-cards',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    TabViewModule,
    ButtonModule,
    BadgeModule,
    TooltipModule,
    MultiSelectModule,
    OverlayPanelModule,
    PopoverModule,
    FileUploadModule,
    DialogModule,
    CheckboxModule,
    InputTextModule,
    Select,
    TagModule,
    ImageModule,
    ToolbarModule,
    StepsModule,
  ],
  templateUrl: './student-cards.component.html',
  styleUrl: './student-cards.component.css'
})
export class StudentCardsComponent implements OnInit, OnDestroy {
  pendingStudents: StudentCard[] = [];
  validatedStudents: StudentCard[] = [];
  unmatchedStudent: StudentCard[] = [];
  flaggedStudents: StudentCard[] = [];
  fallbackPhotoUrl = 'img/card-img.png';
  photoPreviewUrls: Record<number, string> = {};
  statusStudentCardOptions: Dictionary[] = [];
  statusStudentCardDniOptions: Dictionary[] = [];
  selectedFlags: Dictionary[] = [];
  selectedPhotoFlags: Dictionary[] = [];
  selectedDniFlags: Dictionary[] = [];
  selectedFlaggedCard?: StudentCard;
  showSelectError: boolean = false;
  previewUrl: string = 'img/card-img.png';
  selectedUploadCard!: StudentCard;
  reviewDialogVisible = false;
  reviewStudent?: StudentCard;
  reviewDniObjectUrl?: string;
  reviewDniSafeUrl?: SafeResourceUrl;
  reviewDniIsPdf = false;
  suneduPhotoValidated = false;
  identityConfirmed = false;
  isReviewSubmitting = false;
  uploadingReviewFileType?: StudentFileType;
  editDialogVisible = false;
  editStudent?: StudentCard;
  editStudentForm!: FormGroup;
  isEditSubmitting = false;
  isManualRegistrationEdit = false;
  manualRegistrationStep = 0;
  manualRegistrationSteps = [
    {label: 'Datos'},
    {label: 'Foto y DNI'},
  ];
  manualRegistrationPhotoFile?: File;
  manualRegistrationDniFile?: File;
  manualRegistrationPhotoPreviewUrl = 'img/card-img.png';
  manualRegistrationUsesPreviousPhoto = false;
  manualRegistrationDniPreviewUrl?: string;
  manualRegistrationDniSafeUrl?: SafeResourceUrl;
  manualRegistrationDniIsPdf = false;
  manualRegistrationPhotoApproved = false;
  manualRegistrationIdentityConfirmed = false;
  campusOptions: Dictionary[] = [];
  idTypeOptions: Dictionary[] = [];
  genderOptions: Dictionary[] = [];
  private loadingPhotoIds = new Set<number>();
  private observationsMultiSelectTimer?: ReturnType<typeof setTimeout>;
  constructor(
    private studentCardService: StudentCardService,
    private dictionaryService: DictionaryService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.initEditStudentForm();
    this.loadEditFormDictionaries();
    this.dictionaryService.listStudentCardFlags().subscribe({
      next: studentCardFlagsData => {
        if (studentCardFlagsData.status === STATUS.success) {
          const flaggedList = studentCardFlagsData.payload!.data;
          this.statusStudentCardOptions = flaggedList.map((item: Dictionary) => ({
            id: item.id,
            value: item.value,
            label: item.label,
          }));
        } else {
          this.notificationService.notifyApiData(studentCardFlagsData)
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
    this.dictionaryService.listStudentCardDniFlags().subscribe({
      next: studentCardDniFlagsData => {
        if (studentCardDniFlagsData.status === STATUS.success) {
          const flaggedList = studentCardDniFlagsData.payload!.data;
          this.statusStudentCardDniOptions = flaggedList.map((item: Dictionary) => ({
            id: item.id,
            value: item.value,
            label: item.label,
          }));
        } else {
          this.notificationService.notifyApiData(studentCardDniFlagsData)
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
    this.studentCardService.listPendingStudentCards().subscribe({
      next: pendingStudentCardsData => {
        if (pendingStudentCardsData.status === STATUS.success) {
          this.pendingStudents = pendingStudentCardsData.payload.data;
          this.loadStudentPhotoPreviews(this.pendingStudents);
        } else {
          this.notificationService.notifyApiData(pendingStudentCardsData);
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
    this.studentCardService.listUnmatchedStudentCards().subscribe({
      next: unmatchedStudentCardsData => {
        if (unmatchedStudentCardsData.status === STATUS.success) {
          this.unmatchedStudent = unmatchedStudentCardsData.payload.data;
        } else {
          this.notificationService.notifyApiData(unmatchedStudentCardsData);
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
    this.studentCardService.listValidatedStudentCards().subscribe({
      next: validatedStudentCardsData => {
        if (validatedStudentCardsData.status === STATUS.success) {
          this.validatedStudents = validatedStudentCardsData.payload.data;
          this.loadStudentPhotoPreviews(this.validatedStudents);
        } else {
          this.notificationService.notifyApiData(validatedStudentCardsData);
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
    this.studentCardService.listFlaggedStudentCards().subscribe({
      next: flaggedStudentCardsData => {
        if (flaggedStudentCardsData.status === STATUS.success) {
          this.flaggedStudents = flaggedStudentCardsData.payload.data;
          this.loadStudentPhotoPreviews(this.flaggedStudents);
        } else {
          this.notificationService.notifyApiData(flaggedStudentCardsData);
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  ngOnDestroy(): void {
    Object.values(this.photoPreviewUrls).forEach(url => URL.revokeObjectURL(url));
    this.photoPreviewUrls = {};
    this.revokeReviewDniUrl();
    this.revokeManualRegistrationPreviews();
    this.clearObservationPanelTimer();
  }

  private initEditStudentForm(): void {
    this.editStudentForm = this.fb.group({
      id_type: [null, Validators.required],
      code: ['', [Validators.required, Validators.maxLength(15), Validators.pattern(/^[0-9]+$/)]],
      number: [{value: '', disabled: true}],
      names: [{value: '', disabled: true}],
      father_last_name: [{value: '', disabled: true}],
      mother_last_name: [{value: '', disabled: true}],
      check_digit: [null, [Validators.required, Validators.min(0), Validators.max(9), Validators.pattern(/^[0-9]$/)]],
      gender: [null, Validators.required],
      email: ['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)]],
      cellphone: ['', [Validators.required, Validators.maxLength(9), Validators.pattern(/^[0-9]+$/)]],
      address: ['', Validators.required],
      campus: [null, Validators.required],
    }, {validators: this.codeMustDifferFromDocumentValidator()});
  }

  get editForm() {
    return this.editStudentForm.controls;
  }

  hasEditCodeDocumentConflict(): boolean {
    return this.editStudentForm.hasError('codeMatchesDocument')
      && (this.editForm['code'].dirty || this.editForm['code'].touched);
  }

  private loadEditFormDictionaries(): void {
    this.dictionaryService.getGenderList().subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          this.genderOptions = data.payload!.data.map(g => ({id: g.id, value: g.value, label: g.label}));
        }
      },
      error: e => console.error(e),
    });

    this.dictionaryService.getCampusList().subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          this.campusOptions = data.payload!.data.map(c => ({id: c.id, value: c.value, label: c.label}));
        }
      },
      error: e => console.error(e),
    });

    this.dictionaryService.getIdTypeList().subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          this.idTypeOptions = data.payload!.data.map(type => ({
            id: type.id,
            value: type.value,
            label: `${type.value} - ${type.label}`,
          }));
        }
      },
      error: e => console.error(e),
    });
  }

  getStudentPhotoUrl(student: StudentCard): string {
    return this.photoPreviewUrls[student.id] ?? student.previous_photo_url ?? this.fallbackPhotoUrl;
  }

  onStudentPhotoError(student: StudentCard): void {
    this.revokeStudentPhotoPreview(student.id);
  }

  private loadStudentPhotoPreviews(students: StudentCard[]): void {
    students.forEach(student => this.loadStudentPhotoPreview(student));
  }

  private loadStudentPhotoPreview(student: StudentCard): void {
    if (!student?.id || this.photoPreviewUrls[student.id] || this.loadingPhotoIds.has(student.id)) {
      return;
    }

    this.loadingPhotoIds.add(student.id);

    this.studentCardService.downloadAcademicStudentFile(student.id, 'photo').subscribe({
      next: async (response) => {
        const blob = response.body;

        if (!blob || blob.type.includes('json') || blob.type.includes('text')) {
          await this.logBlobError(blob, student.id);
          return;
        }

        this.setStudentPhotoPreview(student.id, URL.createObjectURL(blob));
      },
      error: (e) => {
        this.loadingPhotoIds.delete(student.id);
        console.error(e);
      },
      complete: () => {
        this.loadingPhotoIds.delete(student.id);
      }
    });
  }

  private setStudentPhotoPreview(studentId: number, url: string): void {
    this.revokeStudentPhotoPreview(studentId);
    this.photoPreviewUrls[studentId] = url;
  }

  private revokeStudentPhotoPreview(studentId: number): void {
    const previousUrl = this.photoPreviewUrls[studentId];

    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
      delete this.photoPreviewUrls[studentId];
    }
  }

  private async logBlobError(blob: Blob | null, studentId: number): Promise<void> {
    if (!blob) {
      console.warn(`Student file ${studentId} was not returned by the API`);
      return;
    }

    try {
      console.warn(`Student file ${studentId} was not returned as a previewable file`, await blob.text());
    } catch (e) {
      console.error(e);
    }
  }

  openReviewDialog(student: StudentCard): void {
    this.reviewStudent = student;
    this.reviewDialogVisible = true;
    this.selectedFlags = [];
    this.selectedPhotoFlags = [];
    this.selectedDniFlags = [];
    this.showSelectError = false;
    this.suneduPhotoValidated = student.photo?.status?.value === 'approved';
    this.identityConfirmed = student.dni?.status?.value === 'approved';
    this.loadReviewDni(student);
  }

  closeReviewDialog(): void {
    this.reviewDialogVisible = false;
    this.reviewStudent = undefined;
    this.selectedFlags = [];
    this.selectedPhotoFlags = [];
    this.selectedDniFlags = [];
    this.showSelectError = false;
    this.suneduPhotoValidated = false;
    this.identityConfirmed = false;
    this.revokeReviewDniUrl();
  }

  openEditStudentDialog(student: StudentCard): void {
    this.isManualRegistrationEdit = false;
    this.editStudent = student;
    this.editDialogVisible = true;
    this.editStudentForm.reset({
      id_type: student.id_type?.id ?? null,
      code: student.code ?? '',
      number: student.number || student.id_student || '',
      names: student.names || this.getNamePart(student.fullName, 0),
      father_last_name: student.father_last_name || this.getNamePart(student.fullName, 1),
      mother_last_name: student.mother_last_name || this.getNamePart(student.fullName, 2),
      check_digit: student.check_digit ?? null,
      gender: student.gender?.id ?? null,
      email: student.email ?? '',
      cellphone: student.cellphone ?? '',
      address: student.address ?? '',
      campus: student.campus?.id ?? null,
    });
  }

  openManualRegistrationDialog(student: StudentCard): void {
    this.isManualRegistrationEdit = true;
    this.manualRegistrationStep = 0;
    this.editStudent = student;
    this.editDialogVisible = true;
    this.revokeManualRegistrationPreviews();
    this.manualRegistrationPhotoFile = undefined;
    this.manualRegistrationDniFile = undefined;
    this.manualRegistrationPhotoPreviewUrl = student.previous_photo_url ?? 'img/card-img.png';
    this.manualRegistrationUsesPreviousPhoto = !!student.previous_photo_url;
    this.manualRegistrationPhotoApproved = false;
    this.manualRegistrationIdentityConfirmed = false;
    this.editStudentForm.reset({
      id_type: student.id_type?.id ?? null,
      code: student.code ?? '',
      number: student.number || student.id_student || '',
      names: student.names || this.getNamePart(student.fullName, 0),
      father_last_name: student.father_last_name || this.getNamePart(student.fullName, 1),
      mother_last_name: student.mother_last_name || this.getNamePart(student.fullName, 2),
      check_digit: student.check_digit ?? null,
      gender: student.gender?.id ?? null,
      email: student.email ?? '',
      cellphone: student.cellphone ?? '',
      address: student.address ?? '',
      campus: student.campus?.id ?? null,
    });
  }

  closeEditStudentDialog(): void {
    this.editDialogVisible = false;
    this.editStudent = undefined;
    this.isEditSubmitting = false;
    this.isManualRegistrationEdit = false;
    this.manualRegistrationStep = 0;
    this.revokeManualRegistrationPreviews();
    this.manualRegistrationPhotoFile = undefined;
    this.manualRegistrationDniFile = undefined;
    this.manualRegistrationUsesPreviousPhoto = false;
    this.manualRegistrationPhotoApproved = false;
    this.manualRegistrationIdentityConfirmed = false;
    this.editStudentForm.reset();
  }

  saveEditStudent(): void {
    if (!this.editStudent) {
      return;
    }

    if (this.editStudentForm.invalid) {
      Object.values(this.editStudentForm.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });
      if (this.editStudentForm.hasError('codeMatchesDocument')) {
        this.notificationService.warning('Advertencia', 'El código del alumno no puede ser igual al documento.');
        return;
      }
      this.notificationService.warning('Alerta', 'Por favor, complete todos los campos requeridos.');
      return;
    }

    const formValues = this.editStudentForm.getRawValue();
    this.isEditSubmitting = true;

    if (this.isManualRegistrationEdit) {
      this.saveManualRegistration(formValues);
      return;
    }

    this.studentCardService.updateAcademicStudentBasicInfo({
      id: this.editStudent.id,
      id_type: formValues.id_type,
      code: formValues.code,
      check_digit: formValues.check_digit,
      email: formValues.email,
      cellphone: formValues.cellphone,
      address: formValues.address,
      campus: formValues.campus,
      gender: formValues.gender,
    }).subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          this.applyStudentBasicInfoUpdate(this.editStudent!, data.payload.data);
          this.closeEditStudentDialog();
        }
        this.notificationService.notifyApiData(data);
      },
      error: e => {
        this.isEditSubmitting = false;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.isEditSubmitting = false;
      }
    });
  }

  private applyStudentBasicInfoUpdate(student: StudentCard, updated: StudentCard): void {
    student.code = updated.code;
    student.number = updated.number;
    student.id_student = updated.number || student.id_student;
    student.fullName = updated.fullName || student.fullName;
    student.campus = updated.campus;
    student.cellphone = updated.cellphone;
    student.email = updated.email;
    student.address = updated.address;
    student.check_digit = updated.check_digit;
    student.id_type = updated.id_type;
    student.gender = updated.gender;
  }

  getCampusLabel(student: StudentCard): string {
    const campus = student.campus as unknown;

    if (typeof campus === 'string') {
      return campus;
    }

    return student.campus?.label ?? 'Sin sede';
  }

  hasMissingCampus(student: StudentCard): boolean {
    return this.getCampusLabel(student).trim().toLowerCase() === 'sin sede';
  }

  isCodeSameAsDocument(student: StudentCard): boolean {
    const code = student.code?.trim();
    const documentNumber = (student.number || student.id_student)?.trim();

    return !!code && !!documentNumber && code === documentNumber;
  }

  private codeMustDifferFromDocumentValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const code = control.get('code')?.value?.toString().trim();
      const documentNumber = control.get('number')?.value?.toString().trim();

      return code && documentNumber && code === documentNumber
        ? {codeMatchesDocument: true}
        : null;
    };
  }

  getFileStatusLabel(student: StudentCard, type: StudentFileType): string {
    if (!student[type]) {
      return 'No existe archivo';
    }

    return student[type]?.status?.label ?? 'Pendiente';
  }

  getFileStatusSeverity(student: StudentCard, type: StudentFileType): 'success' | 'warn' | 'danger' | 'secondary' {
    if (!student[type]) {
      return 'danger';
    }

    switch (student[type]?.status?.value) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  getFileStatusIcon(student: StudentCard, type: StudentFileType): string {
    if (!student[type]) {
      return 'pi pi-lock';
    }

    switch (student[type]?.status?.value) {
      case 'approved':
        return 'pi pi-check-circle';
      case 'rejected':
        return 'pi pi-times-circle';
      case 'pending':
        return 'pi pi-clock';
      default:
        return 'pi pi-minus-circle';
    }
  }

  getStudentFileFlags(student: StudentCard, type: StudentFileType): any[] {
    if (type === 'photo') {
      return student.photo_flags ?? student.photo?.flags ?? student.list_flags ?? [];
    }

    return student.dni_flags ?? student.dni?.flags ?? [];
  }

  isManualRegistration(student: StudentCard): boolean {
    return !!student.manual_registration;
  }

  nextManualRegistrationStep(): void {
    if (this.editStudentForm.invalid) {
      Object.values(this.editStudentForm.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });

      if (this.editStudentForm.hasError('codeMatchesDocument')) {
        this.notificationService.warning('Advertencia', 'El codigo del alumno no puede ser igual al documento.');
        return;
      }

      this.notificationService.warning('Alerta', 'Por favor, complete todos los campos requeridos.');
      return;
    }

    this.manualRegistrationStep = 1;
  }

  previousManualRegistrationStep(): void {
    this.manualRegistrationStep = 0;
  }

  async onManualRegistrationFileSelect(event: Event, type: StudentFileType): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!(await this.isValidReviewFile(file, type))) {
      return;
    }

    if (type === 'photo') {
      this.revokeManualRegistrationPhotoPreview();
      this.manualRegistrationPhotoFile = file;
      this.manualRegistrationUsesPreviousPhoto = false;
      this.manualRegistrationPhotoPreviewUrl = URL.createObjectURL(file);
      return;
    }

    this.revokeManualRegistrationDniPreview();
    this.manualRegistrationDniFile = file;

    const url = URL.createObjectURL(file);
    this.manualRegistrationDniPreviewUrl = url;
    this.manualRegistrationDniIsPdf = file.type === 'application/pdf';
    this.manualRegistrationDniSafeUrl = this.manualRegistrationDniIsPdf
      ? this.sanitizer.bypassSecurityTrustResourceUrl(url)
      : undefined;
  }

  private revokeManualRegistrationPreviews(): void {
    this.revokeManualRegistrationPhotoPreview();
    this.revokeManualRegistrationDniPreview();
  }

  private revokeManualRegistrationPhotoPreview(): void {
    if (this.manualRegistrationPhotoPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.manualRegistrationPhotoPreviewUrl);
    }

    this.manualRegistrationPhotoPreviewUrl = 'img/card-img.png';
  }

  private revokeManualRegistrationDniPreview(): void {
    if (this.manualRegistrationDniPreviewUrl) {
      URL.revokeObjectURL(this.manualRegistrationDniPreviewUrl);
    }

    this.manualRegistrationDniPreviewUrl = undefined;
    this.manualRegistrationDniSafeUrl = undefined;
    this.manualRegistrationDniIsPdf = false;
  }

  prepareUnmatchedStudentCard(student: StudentCard, action: 'review' | 'edit'): void {
    this.studentCardService.ensurePendingStudentCard({
      code: student.code,
      number: student.number || student.id_student,
    }).subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          const pendingStudent = data.payload.data;
          this.unmatchedStudent = this.unmatchedStudent.filter(s =>
            (s.number || s.id_student) !== (student.number || student.id_student)
              && s.code !== student.code
          );
          this.pendingStudents = [
            pendingStudent,
            ...this.pendingStudents.filter(s => s.id !== pendingStudent.id)
          ];
          this.loadStudentPhotoPreview(pendingStudent);

          if (action === 'review') {
            this.openReviewDialog(pendingStudent);
          } else {
            this.openEditStudentDialog(pendingStudent);
          }
        }

        this.notificationService.notifyApiData(data);
      },
      error: e => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  private saveManualRegistration(formValues: any): void {
    if (!this.editStudent) {
      return;
    }

    if ((!this.manualRegistrationPhotoFile && !this.manualRegistrationUsesPreviousPhoto) || !this.manualRegistrationDniFile) {
      this.isEditSubmitting = false;
      this.notificationService.warning('Archivos requeridos', 'Debe subir la foto o usar una foto validada anterior, y tambien subir el DNI.');
      return;
    }

    const payload = new FormData();
    payload.append('number', formValues.number);
    payload.append('code', formValues.code);
    payload.append('id_type', formValues.id_type);
    payload.append('check_digit', formValues.check_digit);
    payload.append('gender', formValues.gender);
    payload.append('email', formValues.email);
    payload.append('cellphone', formValues.cellphone);
    payload.append('address', formValues.address);
    payload.append('campus', formValues.campus);
    if (this.manualRegistrationPhotoFile) {
      payload.append('photo', this.manualRegistrationPhotoFile);
    } else if (this.manualRegistrationUsesPreviousPhoto) {
      payload.append('use_previous_photo', '1');
    }
    payload.append('dni', this.manualRegistrationDniFile);
    payload.append('sunedu_photo_validated', this.manualRegistrationPhotoApproved ? '1' : '0');
    payload.append('identity_confirmed', this.manualRegistrationIdentityConfirmed ? '1' : '0');

    this.studentCardService.storeManualRegistration(payload).subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          const registeredStudent = data.payload.data;
          this.unmatchedStudent = this.unmatchedStudent.filter(s =>
            (s.number || s.id_student) !== (this.editStudent!.number || this.editStudent!.id_student)
              && s.code !== this.editStudent!.code
          );

          if (registeredStudent.status?.value === 'validated') {
            this.validatedStudents = [
              registeredStudent,
              ...this.validatedStudents.filter(s => s.id !== registeredStudent.id)
            ];
          } else {
            this.pendingStudents = [
              registeredStudent,
              ...this.pendingStudents.filter(s => s.id !== registeredStudent.id)
            ];
          }

          this.loadStudentPhotoPreview(registeredStudent);
          this.closeEditStudentDialog();
        }

        this.notificationService.notifyApiData(data);
      },
      error: e => {
        this.isEditSubmitting = false;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.isEditSubmitting = false;
      }
    });
  }

  onGlobalFilter(table: any, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getNamePart(fullName: string | undefined, index: number): string {
    return fullName?.split(' ')?.[index] ?? '';
  }

  canValidateReview(): boolean {
    return !!this.reviewStudent
      && !!this.reviewStudent.photo
      && !!this.reviewStudent.dni
      && this.isReviewFileApproved('photo')
      && this.isReviewFileApproved('dni')
      && !this.isReviewSubmitting;
  }

  getReviewMissingStudentData(student: StudentCard): string[] {
    const missingFields: string[] = [];
    const documentNumber = student.number || student.id_student;

    const requiredFields: Array<[string, unknown]> = [
      ['Tipo de documento', student.id_type?.id],
      ['Codigo', student.code],
      ['Documento', documentNumber],
      ['Nombres', student.names || this.getNamePart(student.fullName, 0)],
      ['Apellido paterno', student.father_last_name || this.getNamePart(student.fullName, 1)],
      ['Apellido materno', student.mother_last_name || this.getNamePart(student.fullName, 2)],
      ['Digito verificador', student.check_digit],
      ['Genero', student.gender?.id],
      ['Correo', student.email],
      ['Celular', student.cellphone],
      ['Direccion', student.address],
      ['Sede', student.campus?.id],
    ];

    requiredFields.forEach(([label, value]) => {
      if (value === null || value === undefined || value.toString().trim() === '') {
        missingFields.push(label);
      }
    });

    if (student.code?.trim() && documentNumber?.trim() && student.code.trim() === documentNumber.trim()) {
      missingFields.push('Codigo diferente al documento');
    }

    if (student.cellphone?.trim() && !/^[0-9]{9}$/.test(student.cellphone.trim())) {
      missingFields.push('Celular de 9 digitos');
    }

    if (student.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(student.email.trim())) {
      missingFields.push('Correo valido');
    }

    const checkDigit = student.check_digit?.toString().trim();
    if (checkDigit && !/^[0-9]$/.test(checkDigit)) {
      missingFields.push('Digito verificador de un digito');
    }

    return missingFields;
  }

  isReviewFileApproved(type: StudentFileType): boolean {
    return this.reviewStudent?.[type]?.status?.value === 'approved';
  }

  onReviewFileApprovalChange(type: StudentFileType, checked: boolean): void {
    const student = this.reviewStudent;
    const file = student?.[type];

    if (!student || !file) {
      this.setReviewApprovalCheckbox(type, false);
      this.notificationService.warning(
        'Archivo requerido',
        type === 'photo' ? 'Debe existir una foto antes de aprobarla.' : 'Debe existir un DNI antes de aprobarlo.'
      );
      return;
    }

    const previousStatus = file.status;

    this.studentCardService.setStudentFileStatus({
      id: student.id,
      type,
      status: checked ? 'approved' : 'pending'
    }).subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          file.status = data.payload.data.status;
          this.setReviewApprovalCheckbox(type, data.payload.data.status?.value === 'approved');
        } else {
          file.status = previousStatus;
          this.setReviewApprovalCheckbox(type, previousStatus?.value === 'approved');
        }
        this.notificationService.notifyApiData(data);
      },
      error: e => {
        file.status = previousStatus;
        this.setReviewApprovalCheckbox(type, previousStatus?.value === 'approved');
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  private setReviewApprovalCheckbox(type: StudentFileType, checked: boolean): void {
    if (type === 'photo') {
      this.suneduPhotoValidated = checked;
      return;
    }

    this.identityConfirmed = checked;
  }

  confirmReviewValidation(): void {
    const student = this.reviewStudent;

    if (!student) {
      return;
    }


    if (!this.canValidateReview()) {
      this.notificationService.warning(
        'Validación incompleta',
        'Debe aprobar la foto SUNEDU y confirmar la identidad con el DNI.'
      );
      return;
    }

    const missingFields = this.getReviewMissingStudentData(student);
    if (missingFields.length > 0) {
      this.notificationService.warning(
        'Datos incompletos',
        `Complete o corrija estos campos: ${missingFields.join(', ')}.`
      );
      return;
    }

    this.isReviewSubmitting = true;

    const payload = new FormData();
    payload.append('id', student.id.toString());

    this.studentCardService.validateStudentCard(payload).subscribe({
      next: (data) => {
        if (data.status === STATUS.success) {
          this.validatedStudents.push(student);
          this.pendingStudents = this.pendingStudents.filter(s => s.id !== student.id);
          this.closeReviewDialog();
        }
        this.notificationService.notifyApiData(data);
      },
      error: (e) => {
        this.isReviewSubmitting = false;
        if (e?.message === 'api-flow-stopped') {
          return;
        }

        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.isReviewSubmitting = false;
      }
    });
  }

  confirmReviewObservation(): void {
    const student = this.reviewStudent;

    if (!student) {
      return;
    }

    if (!student.photo || !student.dni) {
      this.notificationService.warning(
        'Archivos requeridos',
        'Debe existir la foto y el DNI antes de observar al estudiante.'
      );
      return;
    }

    if (!this.selectedPhotoFlags?.length && !this.selectedDniFlags?.length) {
      this.showSelectError = true;
      return;
    }

    this.isReviewSubmitting = true;
    const selectedPhotoFlags = [...this.selectedPhotoFlags];
    const selectedDniFlags = [...this.selectedDniFlags];

    this.studentCardService.setFlaggedStudentCard({
      id: student.id,
      photo_flags: this.toStoredFlags(selectedPhotoFlags),
      dni_flags: this.toStoredFlags(selectedDniFlags)
    }).subscribe({
      next: (data) => {
        if (data.status === STATUS.success) {
          student.list_flags = [...selectedPhotoFlags, ...selectedDniFlags];
          this.pendingStudents = this.pendingStudents.filter(s => s.id !== student.id);
          this.flaggedStudents.push(student);
          this.closeReviewDialog();
        }
        this.notificationService.notifyApiData(data);
      },
      error: (e) => {
        this.isReviewSubmitting = false;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.isReviewSubmitting = false;
      }
    });
  }

  private toStoredFlags(flags: Dictionary[]): Array<{code: string; name: string}> {
    return flags.map(flag => ({
      code: (flag.value ?? flag.id ?? '').toString(),
      name: flag.label ?? '',
    }));
  }

  private ensureApiSuccess(data: ApiData<any>): void {
    if (data.status === STATUS.success) {
      return;
    }

    this.notificationService.notifyApiData(data);
    throw new Error('api-flow-stopped');
  }

  private loadReviewDni(student: StudentCard): void {
    this.revokeReviewDniUrl();

    this.studentCardService.downloadAcademicStudentFile(student.id, 'dni').subscribe({
      next: async (response) => {
        const blob = response.body;

        if (!blob || blob.type.includes('json') || blob.type.includes('text')) {
          await this.logBlobError(blob, student.id);
          return;
        }

        this.reviewDniObjectUrl = URL.createObjectURL(blob);
        this.reviewDniIsPdf = blob.type.includes('pdf');
        this.reviewDniSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.reviewDniObjectUrl);
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  private revokeReviewDniUrl(): void {
    if (this.reviewDniObjectUrl) {
      URL.revokeObjectURL(this.reviewDniObjectUrl);
    }

    this.reviewDniObjectUrl = undefined;
    this.reviewDniSafeUrl = undefined;
    this.reviewDniIsPdf = false;
  }

  validateCardStudent(student: StudentCard) {
    const previousStatus = student.status;
    const payload = new FormData();
    payload.append('id', student.id.toString());
    this.studentCardService.validateStudentCard(payload).subscribe({
      next: (data) => {
        if (data.status === STATUS.success) {
          if (student.status) {
            // Si está validado, lo movemos de pendientes a validados
            this.validatedStudents.push(student);
            this.pendingStudents = this.pendingStudents.filter(s => s.id !== student.id);
            const basePath = student.photo_path.split('?')[0]; // elimina query anterior si lo hubiera
            student.photo_path = `${basePath}?v=${Date.now()}`;
          } else {
            // Si se quitó la validación, lo movemos de validados a pendientes
            this.pendingStudents.push(student);
            this.validatedStudents = this.validatedStudents.filter(s => s.id !== student.id);
          }
        } else {
          student.status = previousStatus;
        }
        this.notificationService.notifyApiData(data);
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  pendingCardStudent(student: StudentCard, list: string) {
    const previousStatus = student.status;
    const payload = new FormData();
    payload.append('id', student.id.toString());
    this.studentCardService.pendingStudentCard(payload).subscribe({
      next: (pending) => {
        if (pending.status === STATUS.success) {
          // Si está validado, lo movemos de pendientes a validados
          this.pendingStudents.push(student);
          if (list === 'validated') {
            this.validatedStudents = this.validatedStudents.filter(s => s.id !== student.id);
          }
          if (list === 'flagged') {
            this.flaggedStudents = this.flaggedStudents.filter(s => s.id !== student.id);
          }
        }  else {
          student.status = previousStatus;
        }
        this.notificationService.notifyApiData(pending);
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }


  downloadReviewFile(type: StudentFileType): void {
    if (!this.reviewStudent) {
      return;
    }

    this.downloadStudentFile(this.reviewStudent, type);
  }

  isUploadingReviewFile(type: StudentFileType): boolean {
    return this.uploadingReviewFileType === type;
  }

  async uploadReviewFile(event: Event, type: StudentFileType): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!this.reviewStudent || !file) {
      return;
    }

    if (!(await this.isValidReviewFile(file, type))) {
      return;
    }

    const formData = new FormData();
    formData.append('id', this.reviewStudent.id.toString());
    formData.append(type, file);
    this.uploadingReviewFileType = type;

    this.studentCardService.updateAcademicStudentFile(type, formData).subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          this.applyStudentFileUpdate(this.reviewStudent!, data.payload.data, type);
        }
        this.notificationService.notifyApiData(data);
      },
      error: e => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.uploadingReviewFileType = undefined;
      }
    });
  }

  private async isValidReviewFile(file: File, type: StudentFileType): Promise<boolean> {
    if (type === 'photo') {
      const requirements = await validatePhotoCardStudent(file);

      if (!requirements.validated) {
        this.notificationService.warning(
          'Foto invalida',
          requirements.invalid.map(err => `• ${err.message}`).join('\n')
        );
        return false;
      }

      return true;
    }

    const isValidDni = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
      || /\.(jpe?g|png|pdf)$/i.test(file.name);

    if (!isValidDni) {
      this.notificationService.warning('Formato inválido', 'El DNI debe estar en formato JPG, PNG o PDF.');
      return false;
    }

    if (file.size > 20 * 1024 * 1024) {
      this.notificationService.warning('Archivo muy grande', 'El DNI no debe superar los 20MB.');
      return false;
    }

    return true;
  }

  private applyStudentFileUpdate(student: StudentCard, updated: StudentCard, type: StudentFileType): void {
    if (updated.photo_path) {
      student.photo_path = updated.photo_path;
    }

    if (updated.photo_name) {
      student.photo_name = updated.photo_name;
    }

    if (updated.status) {
      student.status = updated.status;
    }

    if (updated[type]) {
      const currentFile = student[type];
      student[type] = {
        ...updated[type],
        status: updated[type]?.status ?? currentFile?.status ?? {value: 'pending', label: 'Pendiente'}
      };
    }

    if (type === 'photo') {
      this.suneduPhotoValidated = false;
      this.revokeStudentPhotoPreview(student.id);
      this.loadStudentPhotoPreview(student);
      return;
    }

    this.identityConfirmed = false;
    this.loadReviewDni(student);
  }

  downloadStudentPhoto(student: StudentCard): void {
    this.downloadStudentFile(student, 'photo');
  }

  private downloadStudentFile(student: StudentCard, type: StudentFileType): void {
    this.studentCardService.downloadAcademicStudentFile(student.id, type).subscribe({
      next: async (response) => {
        const blob = response.body;

        if (!blob) {
          return;
        }

        try {
          // Intentar leerlo como JSON
          const text = await blob.text();
          const parsed = JSON.parse(text);

        } catch {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = this.getDownloadFileName(response, `${type}-${student.id}`);
          a.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  private getDownloadFileName(response: HttpResponse<Blob>, fallback: string): string {
    const headerFileName = response.headers.get('X-File-Name')
      || this.getContentDispositionFileName(response.headers.get('Content-Disposition'));

    return headerFileName || fallback;
  }

  private getContentDispositionFileName(contentDisposition: string | null): string | null {
    if (!contentDisposition) {
      return null;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1].replace(/"/g, ''));
    }

    const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return asciiMatch?.[1] ?? null;
  }

  downloadStudentCardsPDF() {
    this.studentCardService.downloadStudentCardsPdf().subscribe({
      next: async (blob) => {
        try {
          const text = await (blob as Blob).text(); // 👈 le decimos a TS que es Blob
          const parsed = JSON.parse(text);

          // if (isApiResponse<any>(parsed)) {
          //   this.notificationService.warning(parsed.response.title, parsed.response.message);
          //   console.log(parsed.response.payload);
          // }
        }
        catch {
          const url = window.URL.createObjectURL(blob as Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'estudiantes_validados.pdf';
          a.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  downloadStudentCardsExcel() {
    this.studentCardService.downloadStudentCardsExcel().subscribe({
      next: async (blob) => {
        try {
          const text = await (blob as Blob).text(); // 👈 le decimos a TS que es Blob
          const parsed = JSON.parse(text);
          // if (isApiResponse<any>(parsed)) {
          //   this.notificationService.warning(parsed.response.title, parsed.response.message);
          //   console.log(parsed.response.payload);
          // }
        }
        catch {
          const url = window.URL.createObjectURL(blob as Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'estudiantes_validados.xlsx';
          a.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  downloadPhotosZip() {
    this.studentCardService.downloadStudentPhotosZip().subscribe({
      next: async (blob) => {
        try {
          const text = await (blob as Blob).text(); // 👈 le decimos a TS que es Blob
          const parsed = JSON.parse(text) as ApiData<any>;
          // if (isApiResponse<any>(parsed)) {
          //   this.notificationService.notifyApiData(parsed);
          //   console.log(parsed.payload.data);
          // }
        } catch {
          // Si no era JSON, descargarlo
          const url = window.URL.createObjectURL(blob as Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'fotos_estudiantes_validados.zip';
          a.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  @ViewChild('overlayObservations') overlayObservations!: OverlayPanel;
  @ViewChild('observationsMultiSelect') observationsMultiSelect!: MultiSelect;

  openObservationPanel(event: Event, student: StudentCard) {
    if (this.selectedFlaggedCard?.id === student.id) {
      return;
    }

    this.clearObservationPanelTimer();
    this.observationsMultiSelect?.hide();
    this.selectedFlags = [];
    this.selectedFlaggedCard = student;
    this.showSelectError = false;
    this.observationsMultiSelectTimer = setTimeout(() => {
      this.overlayObservations.show(event);
      this.observationsMultiSelect.show();
    });
  }

  onCancelObservations(): void {
    this.clearObservationPanelState();
    this.observationsMultiSelect.hide();
    this.overlayObservations.hide();
  }

  clearObservationPanelState(): void {
    this.clearObservationPanelTimer();
    this.selectedFlaggedCard = undefined;
    this.selectedFlags = [];
    this.showSelectError = false;
  }

  private clearObservationPanelTimer(): void {
    if (this.observationsMultiSelectTimer) {
      clearTimeout(this.observationsMultiSelectTimer);
      this.observationsMultiSelectTimer = undefined;
    }
  }

  onObservationSelectionChange(): void {
    if (this.selectedFlags?.length || this.selectedPhotoFlags?.length || this.selectedDniFlags?.length) {
      this.showSelectError = false;
    }
  }

  onConfirmObservations() {
    if (!this.selectedFlags || this.selectedFlags.length === 0) {
      this.showSelectError = true;
      // this.notificationService.warning('Observaciones requeridas', 'Debe seleccionar al menos una observación.')
      return;
    }
    this.showSelectError = false;
    const selectedCard = this.selectedFlaggedCard;
    const selectedFlags = [...this.selectedFlags];

    if (!selectedCard) {
      return;
    }

    const payload = {
      id: selectedCard.id,
      flags: selectedFlags
    };

    this.studentCardService.setFlaggedStudentCard(payload).subscribe({
      next: (data) => {
        if (data.status === STATUS.success) {
          const index = this.pendingStudents.findIndex(s => s.id === selectedCard.id);
          if (index !== -1) {
            const student = this.pendingStudents[index];
            student.list_flags = selectedFlags;
            this.pendingStudents.splice(index, 1);
            this.flaggedStudents.push(student);
          }
          this.notificationService.notifyApiData(data);
        } else {
          this.notificationService.notifyApiData(data);
        }
      }
    });
    this.clearObservationPanelState();
    this.observationsMultiSelect.hide();
    this.overlayObservations.hide();
  }

  @ViewChild('overlayUploadPhoto') overlayUploadPhoto!: OverlayPanel;
  @ViewChild('fileUploader') fileUploader!: FileUpload;

  async onFileSelect(event: any): Promise<void> {
    const selectedFileUpload = this.fileUploader.files[0];

    if (selectedFileUpload && await this.isValidReviewFile(selectedFileUpload, 'photo')) {

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(selectedFileUpload);
    } else {
      this.fileUploader.clear();
      this.previewUrl = 'img/card-img.png';
    }
  }

  async onConfirmUploadPhoto(): Promise<void> {
    const selectedFileUpload = this.fileUploader.files[0];
    if (!selectedFileUpload) {
      // this.notificationService.warning('Sin foto', 'Por favor, seleccione una foto antes de continuar.');
      return;
    }
    if (!(await this.isValidReviewFile(selectedFileUpload, 'photo'))) {
      return;
    }
    const formData = new FormData();
    formData.append('photo', selectedFileUpload);
    formData.append('id', this.selectedUploadCard.id.toString());
    this.studentCardService.updateStudentPhoto(formData).subscribe({
      next: (studentCardData) => {
        if (studentCardData.status === STATUS.success) {
          const studentCard = studentCardData.payload.data;
          this.applyStudentFileUpdate(this.selectedUploadCard, studentCard, 'photo');
          this.pendingStudents.push(this.selectedUploadCard);
          this.flaggedStudents = this.flaggedStudents.filter(s => s.id !== studentCard.id);
          this.overlayUploadPhoto.hide();
        }
        this.notificationService.notifyApiData(studentCardData);
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  showOverlay(event: Event, student: StudentCard): void {
    this.previewUrl = 'img/card-img.png';
    this.selectedUploadCard = student;
    this.fileUploader.clear();
    this.overlayUploadPhoto.toggle(event);
  }

  onlyNumbers(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') || '';

    if (!/^[0-9]+$/.test(pasted)) {
      event.preventDefault();
    }
  }

  onlyOneDigit(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.value.length >= 1) {
      event.preventDefault();
    }
  }

  onPasteOneDigit(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') || '';

    if (!/^[0-9]$/.test(pasted)) {
      event.preventDefault();
    }
  }

  previewFile(student: StudentCard, type: 'photo' | 'dni') {
    const popup = window.open('', '_blank');

    this.studentCardService.downloadAcademicStudentFile(student.id, type).subscribe({
      next: async (response) => {
        const blob = response.body;

        if (!blob || blob.type.includes('json') || blob.type.includes('text')) {
          await this.logBlobError(blob, student.id);
          popup?.close();
          return;
        }

        const url = window.URL.createObjectURL(blob);

        if (popup) {
          popup.location.href = url;
        } else {
          window.open(url, '_blank');
        }

        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      },
      error: (e) => {
        popup?.close();
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }
}
