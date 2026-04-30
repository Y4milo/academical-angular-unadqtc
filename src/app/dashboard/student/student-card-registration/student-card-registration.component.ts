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
import { DropdownModule } from 'primeng/dropdown';
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
    DropdownModule,
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
  selectedFile: File | null = null;
  selectedDniFile: File | null = null;
  campusOptions: Dictionary[] = [];
  idTypeOptions: Dictionary[] = [];
  previewUrl: string = 'img/card-img.png';
  dniPreviewUrl: string = 'img/dni-img.png';
  // Imagen por defecto

  payment_id: string|null = '';
  number: string|null = '';
  code: string|null = '';
  hasValidatedPhoto = false;
  private previewObjectUrl: string | null = null;

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
  ) { }

  ngOnInit(): void {
    this.registrationForm = this.fb.group({
      id_type: [null, Validators.required],
      code_student: ['', [Validators.required, Validators.maxLength(15)]],
      id_student: ['', [Validators.required, Validators.maxLength(20)]],
      check_digit: [null, Validators.required],
      names: ['', [Validators.required, Validators.maxLength(255)]],
      father_last_name: ['', [Validators.required, Validators.maxLength(255)]],
      mother_last_name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      cellphone: ['', [Validators.required, Validators.maxLength(20)]],
      address: ['', [Validators.required, Validators.maxLength(255)]],
      campus: [null, Validators.required],
      photo: [null],
      dni_photo: [null]
    });

    const student = this.loginService.getStudent();
    this.payment_id = student.payment_id;
    this.code = student.code;
    this.number = student.number;

    if (this.payment_id && this.number) {

      this.loadStudentBasicInformation(this.number);
    }
    else {
      this.notificationService.warning('Credenciales no validas','Vuelva a iniciar sesión')
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }
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
  onFileSelect(event: any): void {
    const file: File = event.files?.[0];

    if (!file) return;

    const requirements = validatePhotoCardStudent(file)

    const reader = requirements.reader!;
    if (requirements.validated) {
      this.revokePreviewObjectUrl();
      this.selectedFile = file;
      this.previewUrl = requirements.e.target.result;
      this.registrationForm.patchValue({ photo: file });
      this.registrationForm.get('photo')?.markAsTouched();
    }
    reader.readAsDataURL(file);
  }

  onDniSelect(event: any): void {
    const file: File = event.files?.[0];

    if (!file) return;

    this.selectedDniFile = file;
    this.registrationForm.patchValue({ dni_photo: file });
    this.registrationForm.get('dni_photo')?.markAsTouched();

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.dniPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Envía el formulario si es válido y la foto está presente.
   * También actualiza los datos del estudiante vía API.
   */
  submitForm(): void {
    if (this.registrationForm.valid) {
      const photo = this.registrationForm.get('photo')?.value;

      // Verificar que la foto exista
      if (!photo) {
        // this.notificationService.warning('Falta la foto', 'Debe seleccionar una foto del carné.');
        return;
      }

      const code_student = this.code;
      if (!code_student) {
        this.notificationService.error('Error', 'No se encontró el ID del estudiante.');
        return;
      }

      // 🔁 Paso 1: Guardar datos del estudiante
      this.studentService.updateBasicInfo(code_student, this.registrationForm.value).subscribe({
        next: (student) => {

          if (student.status === STATUS.success){
              const studentInfo = student.payload!.data;
              const formData = new FormData();
              formData.append('photo', this.selectedFile!);
              if (this.selectedDniFile) {
                formData.append('dni_photo', this.selectedDniFile);
              }
              // formData.append('semester_id', this.semester_id!.toString());
              formData.append('student_id', studentInfo.id.toString());
              formData.append('payment_id', this.payment_id!.toString());
              this.studentCardService.uploadCardPhoto(formData).subscribe({
                next: (uploadPhoto) => {
                  this.notificationService.notifyApiData(uploadPhoto);

                },
                error: (e) => {
                  this.notificationService.error(
                    NOTIFICATION_MESSAGE.error_connection.title,
                    NOTIFICATION_MESSAGE.error_connection.message
                  );
                  console.error(e);
                }
              });

          } else {
            // payloadNotification(studentDecoded);
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
    } else {
      // this.notificationService.warning('Error', 'Por favor, complete todos los campos antes de enviar.');
    }
  }


  loadStudentBasicInformation(number: string) {
    this.dictionaryService.getCampusList().subscribe({
      next: campusData => {
        const campusDataDecoded = campusData;
        if (campusDataDecoded.status === STATUS.success){
            const campusList = campusDataDecoded.payload!.data;
            this.campusOptions = campusList.map(campus => ({
              id    : campus.id,
              value : campus.value,
              label : campus.label,
            }));
            this.dictionaryService.getIdTypeList().subscribe({
              next: (idTypeData) => {
                const idTypeDataDecoded = idTypeData;
                if (idTypeDataDecoded.status === STATUS.success){
                    const idTypesList = idTypeDataDecoded.payload!.data;
                    this.idTypeOptions = idTypesList.map(type => ({
                      id: type.id,
                      label: `${type.value} - ${type.label}`
                    }));
                    this.studentService.getStudentBasicInfoById(number).subscribe({
                      next: (studentData) => {

                        if (studentData.status === STATUS.success){
                            const studentInfo = studentData.payload!.data;

                            this.registrationForm.patchValue({
                              ...studentInfo,
                              id_type: studentInfo.id_type?.id ?? null,
                              campus: studentInfo.campus?.id ?? null,
                            });
                            this.loadLastValidatedStudentPhoto(studentInfo.id.toString());

                        } else {
                          this.notificationService.notifyApiData(studentData);
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
                } else {
                  this.notificationService.notifyApiData(idTypeDataDecoded)
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
        } else {
          // this.notificationService.warning(campusDataDecoded.title, campusDataDecoded.message);
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    })
  }

  private loadLastValidatedStudentPhoto(studentId: string): void {
    this.studentCardService.getLastValidatedStudentPhoto(studentId).subscribe({
      next: async (response: HttpResponse<Blob>) => {
        const photoBlob = response.body;
        const contentType = response.headers.get('content-type') ?? photoBlob?.type ?? '';

        if (!photoBlob) {
          return;
        }

        if (contentType.includes('application/json')) {
          return;
        }

        const fileName = this.getPhotoFileName(response);
        const file = new File([photoBlob], fileName, {
          type: photoBlob.type || 'image/jpeg',
        });

        this.revokePreviewObjectUrl();
        this.previewObjectUrl = URL.createObjectURL(file);
        this.previewUrl = this.previewObjectUrl;
        this.selectedFile = file;
        this.hasValidatedPhoto = true;
        this.registrationForm.patchValue({ photo: file });
        this.registrationForm.get('photo')?.markAsTouched();
      },
      error: () => {
        this.hasValidatedPhoto = false;
        this.previewUrl = 'img/card-img.png';
      }
    });
  }

  private getPhotoFileName(response: HttpResponse<Blob>): string {
    const contentDisposition = response.headers.get('content-disposition') ?? '';
    const match = contentDisposition.match(/filename="?([^"]+)"?/i);

    if (match?.[1]) {
      return match[1];
    }

    return `validated-student-photo-${this.number ?? 'student'}.jpg`;
  }

  private revokePreviewObjectUrl(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }
}
