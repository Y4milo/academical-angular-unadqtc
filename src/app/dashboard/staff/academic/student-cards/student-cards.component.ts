import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {StudentCard} from '../../../../models/student/student-card.model';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
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
import {concatMap} from 'rxjs';
import {HttpResponse} from '@angular/common/http';
import {StudentFileType} from '../../../../core/constants/api/student_cards';
import {InputTextModule} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {CommonModule} from '@angular/common';
import {TagModule} from 'primeng/tag';
import {ImageModule} from 'primeng/image';
import {ToolbarModule} from 'primeng/toolbar';

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
  selectedFlags: Dictionary[] = [];
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
  editDialogVisible = false;
  editStudent?: StudentCard;
  editStudentForm!: FormGroup;
  isEditSubmitting = false;
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
    });
  }

  get editForm() {
    return this.editStudentForm.controls;
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
    return this.photoPreviewUrls[student.id] ?? this.fallbackPhotoUrl;
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
    this.showSelectError = false;
    this.suneduPhotoValidated = student.photo?.status?.value === 'approved';
    this.identityConfirmed = student.dni?.status?.value === 'approved';
    this.loadReviewDni(student);
  }

  closeReviewDialog(): void {
    this.reviewDialogVisible = false;
    this.reviewStudent = undefined;
    this.selectedFlags = [];
    this.showSelectError = false;
    this.suneduPhotoValidated = false;
    this.identityConfirmed = false;
    this.revokeReviewDniUrl();
  }

  openEditStudentDialog(student: StudentCard): void {
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

  closeEditStudentDialog(): void {
    this.editDialogVisible = false;
    this.editStudent = undefined;
    this.isEditSubmitting = false;
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
      this.notificationService.warning('Alerta', 'Por favor, complete todos los campos requeridos.');
      return;
    }

    const formValues = this.editStudentForm.getRawValue();
    this.isEditSubmitting = true;

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

  getFileStatusLabel(student: StudentCard, type: StudentFileType): string {
    return student[type]?.status?.label ?? 'Pendiente';
  }

  getFileStatusSeverity(student: StudentCard, type: StudentFileType): 'success' | 'warn' | 'danger' | 'secondary' {
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

  onGlobalFilter(table: any, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  private getNamePart(fullName: string | undefined, index: number): string {
    return fullName?.split(' ')?.[index] ?? '';
  }

  canValidateReview(): boolean {
    return !!this.reviewStudent && this.suneduPhotoValidated && this.identityConfirmed && !this.isReviewSubmitting;
  }

  confirmReviewValidation(): void {
    const student = this.reviewStudent;

    if (!student || !this.canValidateReview()) {
      this.notificationService.warning(
        'Validación incompleta',
        'Debe aprobar la foto SUNEDU y confirmar la identidad con el DNI.'
      );
      return;
    }

    this.isReviewSubmitting = true;

    this.studentCardService.setStudentFileStatus({
      id: student.id,
      type: 'photo',
      status: 'approved'
    }).pipe(
      concatMap((photoStatusData) => {
        this.ensureApiSuccess(photoStatusData);
        return this.studentCardService.setStudentFileStatus({
          id: student.id,
          type: 'dni',
          status: 'approved'
        });
      }),
      concatMap((dniStatusData) => {
        this.ensureApiSuccess(dniStatusData);
        const payload = new FormData();
        payload.append('id', student.id.toString());
        return this.studentCardService.validateStudentCard(payload);
      })
    ).subscribe({
      next: (data) => {
        if (data.status === STATUS.success) {
          if (student.photo) {
            student.photo.status = {value: 'approved', label: 'Aprobado'};
          }
          if (student.dni) {
            student.dni.status = {value: 'approved', label: 'Aprobado'};
          }
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

    if (!this.selectedFlags || this.selectedFlags.length === 0) {
      this.showSelectError = true;
      return;
    }

    this.isReviewSubmitting = true;
    const selectedFlags = [...this.selectedFlags];

    this.studentCardService.setFlaggedStudentCard({
      id: student.id,
      flags: selectedFlags
    }).subscribe({
      next: (data) => {
        if (data.status === STATUS.success) {
          student.list_flags = selectedFlags;
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
    if (this.selectedFlags?.length) {
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

  onFileSelect(event: any): void {
    const selectedFileUpload = this.fileUploader.files[0];

    if (selectedFileUpload &&
      (selectedFileUpload.type === 'image/jpeg' || selectedFileUpload.name.toLowerCase().endsWith('.jpg'))) {

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(selectedFileUpload);
    } else {
      // this.notificationService.warning('Formato de foto', 'Solo se permiten archivos .jpg o .jpeg');
    }
  }

  onConfirmUploadPhoto(): void {
    const selectedFileUpload = this.fileUploader.files[0];
    if (!selectedFileUpload) {
      // this.notificationService.warning('Sin foto', 'Por favor, seleccione una foto antes de continuar.');
      return;
    }
    const formData = new FormData();
    formData.append('photo', selectedFileUpload);
    formData.append('id', this.selectedUploadCard.id.toString());
    this.studentCardService.updateStudentPhoto(formData).subscribe({
      next: (studentCardData) => {
        if (studentCardData.status === STATUS.success) {
          const studentCard = studentCardData.payload.data;
          const previous = studentCard.photo_path;
          studentCard.photo_path = 'img/card-img.png';
          studentCard.photo_path = previous;
          this.validatedStudents.push(studentCard);
          this.flaggedStudents = this.flaggedStudents.filter(s => s.id !== studentCard.id);
          this.revokeStudentPhotoPreview(studentCard.id);
          this.loadStudentPhotoPreview(studentCard);
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
