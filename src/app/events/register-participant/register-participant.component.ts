import { Component } from '@angular/core';
import {CardModule} from 'primeng/card';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NotificationService} from '../../services/notification.service';
import {DropdownModule} from 'primeng/dropdown';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {DictionaryService} from '../../services/dictionary.service';
import {Dictionary} from '../../models/dictionary.model';
import {ParticipantService} from '../../services/participant.service';
import {DialogModule} from 'primeng/dialog';

@Component({
  selector: 'app-register-participant',
  imports: [
    ReactiveFormsModule,
    CardModule,
    DropdownModule,
    InputTextModule,
    ButtonModule,
    DialogModule
  ],
  templateUrl: './register-participant.component.html',
  standalone: true,
  styleUrl: './register-participant.component.css'
})
export class RegisterParticipantComponent {
  form!: FormGroup;
  idTypes: any[] = [];
  genders: any[] = [];
  participantTypes: any[] = [];
  portrait_url: string = '/img/portada_kanchay.png'; // imagen por defecto
  loading = false;

  showWhatsappModal: boolean = false;
  whatsappLink: string = '#';

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private dictionaryService: DictionaryService,
    private participantService: ParticipantService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
  }

  /** Inicializa el formulario con validaciones */
  private initForm(): void {
    this.form = this.fb.group({
      number: ['', [Validators.required, Validators.maxLength(10)]],
      names: ['', [Validators.required, Validators.maxLength(100)]],
      last_name: ['', [Validators.required, Validators.maxLength(100)]],
      maternal_last_name: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phone: ['', [Validators.required, Validators.maxLength(15)]],
      idtype_id: [null, Validators.required],
      gender_id: [null, Validators.required],
      participant_type_id: [null, Validators.required],
      event_id: [1] // si el evento es fijo, puedes cambiarlo dinámicamente
    });
  }

  /** Carga los datos para los dropdowns desde la API */
  private loadDropdowns(): void {
    this.dictionaryService.getIdTypeList().subscribe({
      next: idTypeList => {
        if (idTypeList.status === 'success') {
          const idTypeListData = idTypeList.payload.data;
          this.idTypes = idTypeListData.map((item: Dictionary) => ({
            name: item.label,
            code: item.id.toString(),
          }));
        } else {
          (idTypeList)
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });

    this.dictionaryService.getGenderList().subscribe({
      next: idTypeList => {
        if (idTypeList.status === 'success') {
          const genderListData = idTypeList.payload.data;
          this.genders = genderListData.map((item: Dictionary) => ({
            name: item.label,
            code: item.id.toString(),
          }));
        } else {
          this.notificationService.notifyApiData(idTypeList)
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });

    this.dictionaryService.getParticipantList().subscribe({
      next: participantList => {
        if (participantList.status === 'success') {
          const flaggedList = participantList.payload.data;
          this.participantTypes = flaggedList.map((item: Dictionary) => ({
            name: item.label,
            code: item.id.toString(),
          }));
        } else {
          this.notificationService.notifyApiData(participantList)
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
  }

  /** Envía el formulario */
  onSubmit(): void {
    if (this.form.invalid) {
      this.notificationService.warning(
        'Campos incompletos',
        'Por favor, complete todos los campos obligatorios.'
      );
    }

    this.loading = true;
    const payload = this.form.value;

    this.participantService.storeParticipant(payload).subscribe({
      next: participantResponse => {
        const response = participantResponse.payload;
        if (participantResponse.status === 'success') {
          this.whatsappLink = response.data.link_group;
          this.showWhatsappModal = true;
        }
        this.notificationService.notifyApiData(participantResponse)

      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
  }

  closeModal() {
    this.showWhatsappModal = false;
  }
}
