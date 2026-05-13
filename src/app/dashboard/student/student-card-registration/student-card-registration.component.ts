import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { StepsModule } from 'primeng/steps';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { NotificationService } from '../../../services/notification.service';
import { ReactiveFormsModule } from '@angular/forms';
import {Select} from 'primeng/select';
import { DictionaryService } from '../../../services/dictionary.service';
import { StudentService } from '../../../services/student.service';
import { StudentCardService } from '../../../services/student-card.service';
import {validatePhotoCardStudent} from '../../../helper/helper.util';
import {Dictionary} from '../../../models/dictionary.model';
import {STATUS} from '../../../core/constants/status';
import {NOTIFICATION_MESSAGE} from '../../../core/constants/notification_message';
import {LoginService} from '../../../services/login.service';
import {HttpResponse} from '@angular/common/http';
import {StudentUser} from '../../../models/student-user.model';
import {StudentBasicInfo} from '../../../models/student/student-basic-info.model';
import {DomSanitizer} from '@angular/platform-browser';
import {concatMap, finalize, forkJoin, of, switchMap} from 'rxjs';
import {Router} from '@angular/router';
import {PATHS} from '../../../core/constants/paths';


@Component({
  selector: 'app-student-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    StepsModule,
    FileUploadModule,
    CardModule,
    Select,
  ],
  templateUrl: 'student-card-registration.component.html',
  styleUrl: 'student-card-registration.component.css',
})
export class StudentCardRegistrationComponent implements OnInit, OnDestroy {

  currentStep = 0;
  steps = [
    { label: 'Datos Personales' },
    { label: 'Foto y DNI' },
    { label: 'Registro completo' }
  ];

  registrationForm!: FormGroup;

  campusOptions: Dictionary[] = [];
  idTypeOptions: Dictionary[] = [];
  genderOptions: Dictionary[] = [];
  // Imagen por defecto

  studentUser!: StudentUser;

  studentPayloadResponse: boolean = false;
  photoPayloadResponse: boolean = false;
  dniPayloadResponse: boolean = false;

  hasDniPhoto = false;

  previewUrl: string | null = null;
  previewObjectUrl: string | null = null;
  selectedPhotoFile: File | null = null;
  hasValidatedPhoto = false;

  dniPdfUrl: any | null = null;
  dniImageUrl: string | null = null;
  dniObjectUrl: string | null = null;
  selectedDniFile: File | null = null;
  isSubmitting = false;
  registrationOpen = true;
  registrationAvailabilityMessage = '';

  /**
   * Constructor - se inyectan FormBuilder y MessageService para formularios y notificaciones
   */
  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private dictionaryService: DictionaryService,
    private studentService: StudentService,
    private studentCardService: StudentCardService,
    private loginService: LoginService,
    private sanitizer: DomSanitizer,
    private router: Router,
  ) { }

  ngOnInit(): void {

    this.studentUser = this.loginService.getStudent();
    this.initForm();
    this.initializeFlow()

  }

  ngOnDestroy(): void {
    this.revokePreviewObjectUrl();
    this.revokeDniObjectUrl();
  }

  initializeFlow() {

    this.dictionaryService.getCurrentSemester().pipe(
      switchMap((semesterData) => {
        if (semesterData.status !== STATUS.success) {
          this.notificationService.notifyApiData(semesterData);
          throw new Error('registration-closed');
        }

        const availability = semesterData.payload?.data?.student_card_registration;
        this.registrationOpen = availability?.can_register ?? false;
        this.registrationAvailabilityMessage = availability?.message ?? 'El registro de carnet universitario no esta disponible.';

        if (!this.registrationOpen) {
          this.notificationService.warning('Registro fuera de fecha', this.registrationAvailabilityMessage);
          throw new Error('registration-closed');
        }

        return this.studentService.setPaymentSession();
      }),

      // 🔥 1. GENDER
      switchMap(() => this.dictionaryService.getGenderList()),

      switchMap((genderData) => {
        if (genderData.status === STATUS.success) {

          this.genderOptions = genderData.payload!.data.map(g => ({
            id: g.id,
            value: g.value,
            label: g.label,
          }));

          return this.dictionaryService.getCampusList();
        }

        throw new Error('Error cargando género');
      }),

      // 🔥 2. CAMPUS
      switchMap((campusData) => {
        if (campusData.status === STATUS.success) {

          this.campusOptions = campusData.payload!.data.map(c => ({
            id: c.id,
            value: c.value,
            label: c.label,
          }));

          return this.dictionaryService.getIdTypeList();
        }

        throw new Error('Error cargando campus');
      }),

      // 🔥 3. ID TYPES
      switchMap((idTypeData) => {
        if (idTypeData.status === STATUS.success) {

          this.idTypeOptions = idTypeData.payload!.data.map(type => ({
            id: type.id,
            label: `${type.value} - ${type.label}`
          }));

          return this.studentService.getStudentBasicInfo();
        }

        throw new Error('Error cargando tipos');
      }),

      // 🔥 4. STUDENT
      switchMap((studentData) => {
        if (studentData.status === STATUS.success) {

          const studentInfo = studentData.payload!.data;

          this.registrationForm.patchValue({
            ...studentInfo,
            id_type: studentInfo.id_type?.id ?? null,
            campus: studentInfo.campus?.id ?? null,
            gender: studentInfo.gender?.id ?? null
          });

          return forkJoin({
            photo: this.studentCardService.downloadFile('photo'),
            dni: this.studentCardService.downloadFile('dni')
          });
        }

        throw new Error('Error cargando estudiante');
      })

    ).subscribe({
      next: ({ photo, dni }) => {
        this.handlePhotoResponse(photo);
        this.handleDniResponse(dni);
      },
      error: (e) => {
        if (e?.message === 'registration-closed') {
          return;
        }

        console.error(e);
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
      }
    });
  }

  handleDniResponse(response: HttpResponse<Blob>) {

    const blob = response.body;
    const contentType = response.headers.get('content-type') ?? blob?.type ?? '';

    // 🔥 DETECTAR SI NO HAY ARCHIVO REAL
    if (!blob || contentType.includes('application/json')) {

      console.log('❌ No hay DNI, mostrando placeholder');

      this.revokeDniObjectUrl();
      this.dniImageUrl = null;
      this.dniPdfUrl = null;

      return;
    }

    this.revokeDniObjectUrl();
    const url = URL.createObjectURL(blob);
    this.dniObjectUrl = url;

    if (blob.type === 'application/pdf') {
      this.dniPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.dniImageUrl = null;
    } else {
      this.dniImageUrl = url;
      this.dniPdfUrl = null;
    }
  }

  handlePhotoResponse(response: HttpResponse<Blob>) {

    const photoBlob = response.body;
    const contentType = response.headers.get('content-type') ?? photoBlob?.type ?? '';

    if (!photoBlob || contentType.includes('application/json')) {

      console.log('❌ No hay foto, limpiando estado');

      this.revokePreviewObjectUrl();

      this.hasValidatedPhoto = false;

      // 🔥 IMAGEN POR DEFECTO
      this.previewUrl = 'img/card-img.png';

      this.registrationForm.patchValue({ photo: null });

      return;
    }

    const fileName = this.getPhotoFileName(response);

    const file = new File([photoBlob], fileName, {
      type: photoBlob.type || 'image/jpeg',
    });

    this.revokePreviewObjectUrl();

    this.previewObjectUrl = URL.createObjectURL(file);
    this.previewUrl = this.previewObjectUrl;

    this.hasValidatedPhoto = true;

    this.registrationForm.patchValue({ photo: file });
    this.registrationForm.get('photo')?.markAsTouched();
  }

  initForm() {
    this.registrationForm = this.fb.group({
      id_type: [null, Validators.required],
      code: [
        '',
        [
        Validators.required,
        Validators.maxLength(15),
        Validators.pattern(/^[0-9]+$/)
      ]],
      number: [{ value: '', disabled: true }],
      names: [{ value: '', disabled: true }],
      father_last_name: [{ value: '', disabled: true }],
      mother_last_name: [{ value: '', disabled: true }],
      check_digit: [
        null,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(9),
          Validators.pattern(/^[0-9]$/)
        ]
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)
        ]
      ],
      cellphone: [
        '', [
          Validators.required,
          Validators.maxLength(9),
          Validators.pattern(/^[0-9]+$/)
        ]],
      address: ['', Validators.required],
      campus: [null, Validators.required],
      gender: [null, Validators.required],
      photo: [null],
      dni_photo: [null]
    }, {validators: this.codeMustDifferFromDocumentValidator()});

    this.studentUser = this.loginService.getStudent();
  }

  get form() {
    return this.registrationForm.controls;
  }

  hasCodeDocumentConflict(): boolean {
    return this.registrationForm.hasError('codeMatchesDocument')
      && (this.form['code'].dirty || this.form['code'].touched);
  }

  /** Avanza al siguiente paso si es válido */
  nextStep() {
    if (this.currentStep === 0 && this.registrationForm.valid) {
      this.currentStep++;
    } else if (this.currentStep === 0) {
      Object.values(this.registrationForm.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });
      if (this.registrationForm.hasError('codeMatchesDocument')) {
        this.notificationService.warning('Advertencia', 'El código del alumno no puede ser igual al DNI.');
        return;
      }
      this.notificationService.warning('Alerta', 'Por favor, complete todos los campos requeridos.');
    }
  }

  /** Regresa al paso anterior */
  previousStep() {
    this.currentStep--;
  }

  /** Maneja la selección de la foto */
  async onPhotoSelect(event: any): Promise<void> {
    const file: File = event.files?.[0];
    if (!file) return;

    const requirements = await validatePhotoCardStudent(file);

    if (!requirements.validated) {
      this.hasValidatedPhoto = false;

      const messages = requirements.invalid
        .map(err => `• ${err.message}`)
        .join('\n');

      this.notificationService.warning(
        'Foto inválida',
        messages
      );

      // reset UI
      this.revokePreviewObjectUrl();
      this.previewUrl = 'img/card-img.png';
      this.selectedPhotoFile = null;
      this.registrationForm.patchValue({ photo: null });

      return;
    }

    this.revokePreviewObjectUrl();

    this.selectedPhotoFile = file;
    this.hasValidatedPhoto = true;
    this.previewObjectUrl = URL.createObjectURL(file);
    this.previewUrl = this.previewObjectUrl;

    this.registrationForm.patchValue({ photo: file });
  }

  onDniSelect(event: any) {

    const file: File = event.files[0];

    if (!file) return;

    // ✅ MAX 20MB
    const maxSize = 20 * 1024 * 1024;

    if (file.size > maxSize) {

      this.notificationService.warning(
        'Archivo demasiado grande',
        'El DNI no debe superar los 20MB.'
      );

      this.selectedDniFile = null;
      return;
    }

    this.revokeDniObjectUrl();
    this.selectedDniFile = file;

    const url = URL.createObjectURL(file);
    this.dniObjectUrl = url;

    if (file.type === 'application/pdf') {
      this.dniPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.dniImageUrl = null;
    } else {
      this.dniImageUrl = url;
      this.dniPdfUrl = null;
    }
  }

  /**
   * Envía el formulario si es válido y la foto está presente.
   * También actualiza los datos del estudiante vía Student_cards.
   */
  submitForm(): void {
    if (this.isSubmitting) {
      return;
    }

    // 1. VALIDAR FORMULARIO
    if (!this.registrationForm.valid) {
      Object.values(this.registrationForm.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });

      if (this.registrationForm.hasError('codeMatchesDocument')) {
        this.notificationService.warning(
          'Advertencia',
          'El código del alumno no puede ser igual al DNI.'
        );
        return;
      }

      this.notificationService.warning(
        'Advertencia',
        'Complete todos los campos requeridos.'
      );
      return;
    }

    // 2. VALIDAR FOTO CARNÉ
    if (!this.selectedPhotoFile && !this.hasValidatedPhoto) {
      this.notificationService.warning(
        'Advertencia',
        'Debe seleccionar una foto del carné.'
      );
      return;
    }

    // 3. VALIDAR DNI
    if (!this.selectedDniFile && !this.dniPdfUrl && !this.dniImageUrl) {
      this.notificationService.warning('Advertencia', 'Debe subir el DNI');
      return;
    }

    // ✅ 1. EXTRAER SOLO DATOS (SIN ARCHIVOS)
    const formValues = this.registrationForm.value;

    const payload: StudentBasicInfo = {
      id_type: formValues.id_type,
      code: formValues.code,
      check_digit: formValues.check_digit,
      email: formValues.email,
      cellphone: formValues.cellphone,
      address: formValues.address,
      campus: formValues.campus,
      gender: formValues.gender
    };

    // 🔁 Guardar datos del estudiante
    // 🔁 Guardar foto del estudiante
    const formDataPhoto = new FormData();
    if (this.selectedPhotoFile) {
      formDataPhoto.append('photo', this.selectedPhotoFile);
    }

    // 🔁 Guardar dni del estudiante
    const formDataDni = new FormData();

    if (this.selectedDniFile) {
      formDataDni.append('dni', this.selectedDniFile);
    }
    this.studentPayloadResponse = false;
    this.photoPayloadResponse = false;
    this.dniPayloadResponse = false;
    this.isSubmitting = true;

    this.studentService.updateBasicInfo(payload).pipe(
      concatMap((studentResponse) => {
        this.ensureApiSuccess(studentResponse);
        this.studentPayloadResponse = true;
        return this.studentCardService.uploadCardPhoto(formDataPhoto);
      }),
      concatMap((cardPhotoResponse) => {
        this.ensureApiSuccess(cardPhotoResponse);
        this.photoPayloadResponse = true;
        return this.studentCardService.uploadDniPhoto(formDataDni);
      }),
      concatMap((dniPhotoResponse) => {
        this.ensureApiSuccess(dniPhotoResponse);
        this.dniPayloadResponse = true;
        return of(dniPhotoResponse);
      }),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: () => {
        this.currentStep = 2;
        this.notificationService.success(
          'Registro completo',
          'Tus datos, foto y DNI fueron registrados correctamente.'
        );
      },
      error: (e) => {
        if (e?.message === 'api-flow-stopped') {
          return;
        }

        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  private ensureApiSuccess(response: any): void {
    if (response.status === STATUS.success) {
      return;
    }

    this.notificationService.notifyApiData(response);
    throw new Error('api-flow-stopped');
  }

  logoutStudent(): void {
    this.loginService.removeUser();
    this.router.navigate([PATHS.login.student]);
  }


  private getPhotoFileName(response: HttpResponse<Blob>): string {
    const contentDisposition = response.headers.get('content-disposition') ?? '';
    const match = contentDisposition.match(/filename="?([^"]+)"?/i);

    if (match?.[1]) {
      return match[1];
    }

    return `validated-student-photo-${this.studentUser.number ?? 'student'}.jpg`;
  }

  private revokePreviewObjectUrl(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }

  private revokeDniObjectUrl(): void {
    if (this.dniObjectUrl) {
      URL.revokeObjectURL(this.dniObjectUrl);
      this.dniObjectUrl = null;
    }
  }

  onlyNumbers(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') || '';

    if (!/^[0-9]+$/.test(pasted)) {
      event.preventDefault();
    }
  }

  onlyOneDigit(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

    if (allowedKeys.includes(event.key)) return;

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }

    const input = event.target as HTMLInputElement;

    // impedir más de 1 dígito
    if (input.value.length >= 1) {
      event.preventDefault();
    }
  }

  onPasteOneDigit(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') || '';

    if (!/^[0-9]$/.test(pasted)) {
      event.preventDefault();
    }
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
}
