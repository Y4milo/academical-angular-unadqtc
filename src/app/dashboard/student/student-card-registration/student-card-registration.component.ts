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
import { jwtDecode } from 'jwt-decode';
import { Payment } from '../../../models/payment.model';
import {decodeApiData, payloadNotification, validatePhotoCardStudent} from '../../../helper/helper.util';

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
  campusOptions: any[] = [];
  idTypeOptions: any[] = [];
  previewUrl: string = 'img/card-img.png';
  // Imagen por defecto

  payment_id: string|null = '';
  semester_id: string|null = '';
  code_student: string|null = '';

  /**
   * Constructor - se inyectan FormBuilder y MessageService para formularios y notificaciones
   */
  constructor(
    private fb: FormBuilder,
    private notification: NotificationService,
    private dictionaryService: DictionaryService,
    private studentService: StudentService,
    private studentCardService: StudentCardService,
    private router: Router,
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
      photo: [null]
    });


    const payment = jwtDecode<Payment>(sessionStorage.getItem('payment_id')! );

    if (payment) {
      this.payment_id = payment.payment_id.toString()!;
      this.semester_id = payment.semester_id.toString()!;
      this.code_student = payment.code_student;
      this.loadStudentBasicInformation(this.code_student);
    }
    else {
      this.notification.warning('Credenciales no validas','Vuelva a iniciar sesión')
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
      this.notification.warning('Alerta', 'Por favor, complete todos los campos requeridos.');
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
      this.selectedFile = file;
      this.previewUrl = requirements.e.target.result;
      this.registrationForm.patchValue({ photo: file });
      this.registrationForm.get('photo')?.markAsTouched();
    }
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
        this.notification.warning('Falta la foto', 'Debe seleccionar una foto del carné.');
        return;
      }

      const code_student = this.code_student;
      if (!code_student) {
        this.notification.error('Error', 'No se encontró el ID del estudiante.');
        return;
      }

      // 🔁 Paso 1: Guardar datos del estudiante
      this.studentService.updateBasicInfo(code_student, this.registrationForm.value).subscribe({
        next: (studentData) => {
          const studentDecoded = decodeApiData(studentData);
          if (studentDecoded.status === 'success'){
              const studentInfo = studentDecoded.payload!.data;
              const formData = new FormData();
              formData.append('photo', this.selectedFile!);
              formData.append('semester_id', this.semester_id!.toString());
              formData.append('student_id', studentInfo.id.toString());
              formData.append('payment_id', this.payment_id!.toString());
              this.studentCardService.uploadCardPhoto(formData).subscribe({
                next: (uploadPhoto) => {
                  payloadNotification(uploadPhoto);
                },
                error: () => {
                  this.notification.error('Error de conexión', 'No se pudo subir la foto.');
                }
              });

          } else {
            // payloadNotification(studentDecoded);
          }
        },
        error: () => {
          this.notification.error('Error de conexión', 'No se pudo conectar con el servidor.');
        }
      });
    } else {
      this.notification.warning('Error', 'Por favor, complete todos los campos antes de enviar.');
    }
  }


  loadStudentBasicInformation(studentCode: string) {
    this.dictionaryService.getCampusList().subscribe({
      next: campusData => {
        const campusDataDecoded = campusData;
        if (campusDataDecoded.status === 'success'){
            const campusList = campusDataDecoded.payload!.data;
            this.campusOptions = campusList.map(campus => ({
              id    : campus.id,
              value : campus.value,
              label : campus.label,
            }));
            this.dictionaryService.getIdTypeList().subscribe({
              next: (idTypeData) => {
                const idTypeDataDecoded = idTypeData;
                if (idTypeDataDecoded.status === 'success'){
                    const idTypesList = idTypeDataDecoded.payload!.data;
                    this.idTypeOptions = idTypesList.map(type => ({
                      id: type.id,
                      label: `${type.value} - ${type.label}`
                    }));
                    this.studentService.getStudentBasicInfoByCode(studentCode).subscribe({
                      next: (studentData) => {
                        const studentInfoData = decodeApiData(studentData);
                        if (studentInfoData.status === 'success'){
                            //adding Student information to the form
                            this.registrationForm.patchValue(studentInfoData.payload!.data);

                        } else {
                          this.notification.error(studentInfoData.title, studentInfoData.message);
                        }
                      },
                      error: () => {
                        this.notification.error('Error de conexión', 'No se pudo conectar con el servidor.');
                      }
                    });
                } else {
                  // this.notification.error(idTypeDataDecoded.title, idTypeDataDecoded.message)
                }
              },
              error: () => {
                this.notification.error('Error de conexión', 'No se pudo conectar con el servidor.');
              }
            });
        } else {
          // this.notification.warning(campusDataDecoded.title, campusDataDecoded.message);
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notification.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    })
  }
}
