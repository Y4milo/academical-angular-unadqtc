import {Component, OnInit, ViewChild} from '@angular/core';
import {StudentCard} from '../../../../models/student-card.model';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {StudentCardService} from '../../../../services/student-card.service';
import {NotificationService} from '../../../../services/notification.service';
import {environment} from '../../../../../environments/environment';
import {CardModule} from 'primeng/card';
import {TabViewModule} from 'primeng/tabview';
import jwtEncode from 'jwt-encode';
import {ButtonModule} from 'primeng/button';
import {ApiResponse} from '../../../../models/api-response.model';
import {BadgeModule} from 'primeng/badge';
import {TooltipModule} from 'primeng/tooltip';
import {MultiSelectModule} from 'primeng/multiselect';
import {OverlayPanel, OverlayPanelModule} from 'primeng/overlaypanel';
import {DictionaryService} from '../../../../services/dictionary.service';
import {Dictionary} from '../../../../models/dictionary.model';
import {jwtDecode} from 'jwt-decode';
import {PopoverModule} from 'primeng/popover';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-student-cards',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    CardModule,
    TabViewModule,
    ButtonModule,
    BadgeModule,
    TooltipModule,
    MultiSelectModule,
    OverlayPanelModule,
    PopoverModule,
    NgClass,
  ],
  templateUrl: './student-cards.component.html',
  styleUrl: './student-cards.component.css'
})
export class StudentCardsComponent implements OnInit {
  pendingStudents: StudentCard[] = [];
  validatedStudents: StudentCard[] = [];
  unmatchedStudent: StudentCard[] = [];
  flaggedStudents: StudentCard[] = [];
  appURL = environment.apiUrlPublic;
  statusStudentCardOptions: { name: string; code: string }[] = [];
  selectedFlags: [] = [];
  selectedFlaggedCard!: StudentCard;
  showSelectError: boolean = false;
  constructor(
    private studentCardService: StudentCardService,
    private dictionaryService: DictionaryService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.dictionaryService.getStudentCardFlags().subscribe({
      next: data => {
        if (data.status === 'success') {
          const flaggedList = jwtDecode(data.response.payload) as Dictionary[];
          this.statusStudentCardOptions = flaggedList.map((item: Dictionary) => ({
            name: item.label,
            code: item.id.toString(),
          }));
        } else if (data.status === 'warning') {
          this.notificationService.warning(data.response.title, data.response.message);
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
    this.studentCardService.getPendingStudentCards().subscribe({
      next: data => {
        if (data.status === 'success') {
          this.pendingStudents = data.response.payload
        } else if (data.status === 'warning') {
          this.notificationService.warning(data.response.title, data.response.message);
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
    this.studentCardService.getUnmatchedStudentCards().subscribe({
      next: data => {
        if (data.status === 'success') {
          this.unmatchedStudent = data.response.payload
        } else if (data.status === 'warning') {
          this.notificationService.warning(data.response.title, data.response.message);
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
    this.studentCardService.getValidatedStudentCards().subscribe({
      next: data => {
        if (data.status === 'success') {
          this.validatedStudents = data.response.payload
        } else if (data.status === 'warning') {
          this.notificationService.warning(data.response.title, data.response.message);
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
    this.studentCardService.getFlaggedStudentCards().subscribe({
      next: data => {
        if (data.status === 'success') {
          this.flaggedStudents = data.response.payload
        } else if (data.status === 'warning') {
          this.notificationService.warning(data.response.title, data.response.message);
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
  }

  validateCardStudent(student: StudentCard) {
    const key = environment.tokenKey;
    const previousStatus = student.status;

    const payload = {
      id: student.id,
    };

    const statusStudentCard = new FormData();
    statusStudentCard.append('payload', jwtEncode(payload, key));

    this.studentCardService.validateStudentCard(statusStudentCard).subscribe({
      next: (data) => {
        if (data.status === 'success') {
          if (student.status) {
            // Si está validado, lo movemos de pendientes a validados
            this.validatedStudents.push(student);
            this.pendingStudents = this.pendingStudents.filter(s => s.id !== student.id);
          } else {
            // Si se quitó la validación, lo movemos de validados a pendientes
            this.pendingStudents.push(student);
            this.validatedStudents = this.validatedStudents.filter(s => s.id !== student.id);
          }

          this.notificationService.success(data.response.title, data.response.message);
        } else if (data.status === 'warning') {
          student.status = previousStatus;
          this.notificationService.warning(data.response.title, data.response.message);
        } else {
          student.status = previousStatus;
          this.notificationService.error('Error', 'Respuesta inesperada del servidor.');
        }
      },
      error: (err) => {
        student.status = previousStatus;
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
  }

  pendingCardStudent(student: StudentCard, list: string) {
    const key = environment.tokenKey;
    const previousStatus = student.status;

    const payload = {
      id: student.id,
    };

    const statusStudentCard = new FormData();
    statusStudentCard.append('payload', jwtEncode(payload, key));

    this.studentCardService.pendingStudentCard(statusStudentCard).subscribe({
      next: (data) => {
        if (data.status === 'success') {
          // Si está validado, lo movemos de pendientes a validados
          this.pendingStudents.push(student);
          if (list === 'validated') {
            this.validatedStudents = this.validatedStudents.filter(s => s.id !== student.id);
          }
          if (list === 'flagged') {
            this.flaggedStudents = this.flaggedStudents.filter(s => s.id !== student.id);
          }
          this.notificationService.success(data.response.title, data.response.message);
        } else if (data.status === 'warning') {
          student.status = previousStatus;
          this.notificationService.warning(data.response.title, data.response.message);
        } else {
          student.status = previousStatus;
          this.notificationService.error('Error', 'Respuesta inesperada del servidor.');
        }
      },
      error: (err) => {
        student.status = previousStatus;
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
  }


  downloadPhoto(student: StudentCard) {
    const key = environment.tokenKey;
    const payload = {
      id: student.id
    };
    const statusStudentCard = new FormData();
    statusStudentCard.append('payload', jwtEncode(payload, key));

    this.studentCardService.downloadStudentCardsPhoto(statusStudentCard).subscribe({
      next: (blob) => {
        try {
          const data = blob as ApiResponse<string>
          this.notificationService.warning(data.response.title, data.response.message);
        }
        catch {
          const url = window.URL.createObjectURL(blob as Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = student.photo_name;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (err) => {
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
  }

  downloadStudentCards() {
    this.studentCardService.downloadStudentCardsPDF().subscribe({
      next: (blob) => {
        try {
          const data = blob as ApiResponse<string>
          this.notificationService.warning(data.response.title, data.response.message);
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
      error: (err) => {
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
  }

  downloadPhotosZip() {
    this.studentCardService.downloadStudentPhotosZip().subscribe({
      next: (blob) => {
        try {
          const url = window.URL.createObjectURL(blob as Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'fotos_estudiantes_validados.zip';
          a.click();
          window.URL.revokeObjectURL(url);
        }
        catch
        {
          const data = blob as ApiResponse<string>
          this.notificationService.warning(data.response.title, data.response.message);
        }
      },
      error: () => {
        this.notificationService.error('Error de conexión', 'No se pudo descargar el archivo ZIP');
      }
    });
  }

  @ViewChild('overlayObservations') overlayObservations!: OverlayPanel;

  openObservationPanel(event: Event, student: StudentCard) {
    this.selectedFlaggedCard = student;
    this.overlayObservations.toggle(event);
  }
  onConfirmObservations() {
    if (!this.selectedFlags || this.selectedFlags.length === 0) {
      this.showSelectError = true;
      this.notificationService.warning('Observaciones requeridas', 'Debe seleccionar al menos una observación.')
      return;
    }
    this.showSelectError = false;

    const key = environment.tokenKey;
    const payload = {
      id: this.selectedFlaggedCard.id,
      flags: this.selectedFlags
    };

    let selectedFlagsData = new FormData();
    selectedFlagsData.append('payload', jwtEncode(payload, key));
    this.studentCardService.setFlaggedStudentCard(selectedFlagsData).subscribe({
      next: (data) => {
        if (data.status === 'success') {
          const index = this.pendingStudents.findIndex(s => s.id === this.selectedFlaggedCard.id);
          if (index !== -1) {
            const student = this.pendingStudents[index];
            // Asignar la copia al estudiante
            student.list_flags = [...this.selectedFlags];
            // Eliminar de la lista de pendientes
            this.pendingStudents.splice(index, 1);
            // Agregar a la lista de observados
            this.flaggedStudents.push(student);
            // Limpiar los flags seleccionados
            this.selectedFlags = [];
          }

          this.notificationService.success(data.response.title, data.response.message);
        } else if (data.status === 'warning') {
          this.notificationService.warning(data.response.title, data.response.message);
        } else if (data.status === 'error') {
          this.notificationService.error(data.response.title, data.response.message);
        }
      }
    });
    this.overlayObservations.hide();
    // this.selectedFlags = [];
  }
}
