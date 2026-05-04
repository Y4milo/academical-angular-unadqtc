import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
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
import { Router} from '@angular/router';
import { StudentCardService } from '../../../services/student-card.service';
import {validatePhotoCardStudent} from '../../../helper/helper.util';
import {Dictionary} from '../../../models/dictionary.model';
import {STATUS} from '../../../core/constants/status';
import {NOTIFICATION_MESSAGE} from '../../../core/constants/notification_message';
import {LoginService} from '../../../services/login.service';
import {HttpResponse} from '@angular/common/http';
import {StudentUser} from '../../../models/student-user.model';
import {StudentBasicInfo} from '../../../models/student/student-basic-info.model';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {forkJoin, switchMap} from 'rxjs';


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
export class StudentCardRegistrationComponent implements OnInit {

  currentStep = 0;
  steps = [
    { label: 'Datos Personales' },
    { label: 'Foto del Carné' }
  ];

  registrationForm!: FormGroup;

  campusOptions: Dictionary[] = [];
  idTypeOptions: Dictionary[] = [];
  dniPreviewUrl!: SafeResourceUrl;
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
  selectedDniFile: File | null = null;

  /**
   * Constructor - se inyectan FormBuilder y MessageService para formularios y notificaciones
   */
  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private dictionaryService: DictionaryService,
    private studentService: StudentService,
    private studentCardService: StudentCardService,
    private router: Router,
    private loginService: LoginService,
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit(): void {

    this.studentUser = this.loginService.getStudent();
    this.initForm();
    this.initializeFlow()

  }

  initializeFlow() {

    this.studentService.setPaymentSession().pipe(

      switchMap(() => this.dictionaryService.getCampusList()),

      switchMap((campusData) => {
        if (campusData.status === STATUS.success) {

          const campusList = campusData.payload!.data;

          this.campusOptions = campusList.map(campus => ({
            id: campus.id,
            value: campus.value,
            label: campus.label,
          }));

          return this.dictionaryService.getIdTypeList();
        }

        throw new Error('Error cargando campus');
      }),

      switchMap((idTypeData) => {
        if (idTypeData.status === STATUS.success) {

          const idTypesList = idTypeData.payload!.data;

          this.idTypeOptions = idTypesList.map(type => ({
            id: type.id,
            label: `${type.value} - ${type.label}`
          }));

          return this.studentService.getStudentBasicInfo();
        }

        throw new Error('Error cargando tipos');
      }),

      switchMap((studentData) => {
        if (studentData.status === STATUS.success) {

          const studentInfo = studentData.payload!.data;

          this.registrationForm.patchValue({
            ...studentInfo,
            id_type: studentInfo.id_type?.id ?? null,
            campus: studentInfo.campus?.id ?? null,
          });

          // 🔥 AQUÍ EL CAMBIO IMPORTANTE
          return forkJoin({
            photo: this.studentCardService.downloadFile('photo'),
            dni: this.studentCardService.downloadFile('dni')
          });
        }

        throw new Error('Error cargando estudiante');
      })

    ).subscribe({

      next: ({ photo, dni }) => {

        // 📸 FOTO
        this.handlePhotoResponse(photo);

        // 🪪 DNI (puedes hacer otro handler)
        this.handleDniResponse(dni);

      },

      error: (e) => {
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

    if (!blob) return;

    const url = URL.createObjectURL(blob);

    if (blob.type === 'application/pdf') {
      this.dniPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url); // 🔥 CLAVE
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
      code: ['', [Validators.required, Validators.maxLength(15)]],
      number: [{ value: '', disabled: true }],
      names: [{ value: '', disabled: true }],
      father_last_name: [{ value: '', disabled: true }],
      mother_last_name: [{ value: '', disabled: true }],
      check_digit: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cellphone: ['', Validators.required],
      address: ['', Validators.required],
      campus: [null, Validators.required],
      photo: [null],
      dni_photo: [null]
    });

    this.studentUser = this.loginService.getStudent();
  }

  get form() {
    return this.registrationForm.controls;
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
    this.previewObjectUrl = URL.createObjectURL(file);
    this.previewUrl = this.previewObjectUrl;

    this.registrationForm.patchValue({ photo: file });
  }

  onDniSelect(event: any) {

    const file: File = event.files[0];
    if (!file) return;

    this.selectedDniFile = file;

    const url = URL.createObjectURL(file);

    // 🔥 IMPORTANTE: detectar tipo
    if (file.type === 'application/pdf') {
      this.dniPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.dniImageUrl = null;
    } else {
      this.dniImageUrl = url;
      this.dniPdfUrl = null;
    }

    console.log('DNI seleccionado:', file.type); // 👈 debug
  }

  /**
   * Envía el formulario si es válido y la foto está presente.
   * También actualiza los datos del estudiante vía API.
   */
  submitForm(): void {
    // 1. VALIDAR FORMULARIO
    if (!this.registrationForm.valid) {
      Object.values(this.registrationForm.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });

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

    console.log('Formulario válido, enviando...');

    // ✅ 1. EXTRAER SOLO DATOS (SIN ARCHIVOS)
    const formValues = this.registrationForm.value;

    const payload: StudentBasicInfo = {
      id_type: formValues.id_type,
      code: formValues.code,
      check_digit: formValues.check_digit,
      email: formValues.email,
      cellphone: formValues.cellphone,
      address: formValues.address,
      campus: formValues.campus
    };

    // 🔁 Guardar datos del estudiante
    this.studentService.updateBasicInfo(payload).subscribe({
      next: (studentResponse) => {
        if (studentResponse.status === STATUS.success){
          this.studentPayloadResponse = true;
          console.log(studentResponse);
        }
        this.notificationService.notifyApiData(studentResponse);
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });

    // 🔁 Guardar foto del estudiante
    const formDataPhoto = new FormData();
    if (this.selectedPhotoFile) {
      formDataPhoto.append('photo', this.selectedPhotoFile);
    }

    this.studentCardService.uploadCardPhoto(formDataPhoto).subscribe({
      next: (cardPhotoResponse) => {
        if (cardPhotoResponse.status === STATUS.success) {
          this.photoPayloadResponse = true
          console.log(cardPhotoResponse);
        }
        this.notificationService.notifyApiData(cardPhotoResponse);
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });

    // 🔁 Guardar dni del estudiante
    const formDataDni = new FormData();

    if (this.selectedDniFile) {
      formDataDni.append('dni', this.selectedDniFile);
    }
    this.studentCardService.uploadDniPhoto(formDataDni).subscribe({
      next: (dniPhotoResponse) => {
        if (dniPhotoResponse.status === STATUS.success) {
          this.dniPayloadResponse = true;
          console.log(dniPhotoResponse);
        }
        this.notificationService.notifyApiData(dniPhotoResponse);
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
}
