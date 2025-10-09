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
import {BadgeModule} from 'primeng/badge';
import {TooltipModule} from 'primeng/tooltip';
import {MultiSelectModule} from 'primeng/multiselect';
import {OverlayPanel, OverlayPanelModule} from 'primeng/overlaypanel';
import {DictionaryService} from '../../../../services/dictionary.service';
import {Dictionary} from '../../../../models/dictionary.model';
import {jwtDecode} from 'jwt-decode';
import {PopoverModule} from 'primeng/popover';
import {NgClass} from '@angular/common';
import {FileUpload, FileUploadModule} from 'primeng/fileupload';
// import {isApiResponse} from '../../../../models/api/api-data.model';
import {decodeApiData, encodeArray, payloadNotification} from '../../../../helper/helper.util';

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
    FileUploadModule,
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
  previewUrl: string = 'img/card-img.png';
  selectedUploadCard!: StudentCard;
  constructor(
    private studentCardService: StudentCardService,
    private dictionaryService: DictionaryService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.dictionaryService.getStudentCardFlags().subscribe({
      next: studentCardFlagsData => {
        if (studentCardFlagsData.payload!.status === 'success') {
          const flaggedList = studentCardFlagsData.payload!.data;
          this.statusStudentCardOptions = flaggedList.map((item: Dictionary) => ({
            name: item.label,
            code: item.id.toString(),
          }));
        } else {
          payloadNotification(studentCardFlagsData.payload!)
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
    this.studentCardService.getPendingStudentCards().subscribe({
      next: pendingStudentCardsData => {
        if (pendingStudentCardsData.payload.status === 'success') {
          this.pendingStudents = pendingStudentCardsData.payload.data;
        } else {
          payloadNotification(pendingStudentCardsData.payload);
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
    this.studentCardService.getUnmatchedStudentCards().subscribe({
      next: unmatchedStudentCardsData => {
        if (unmatchedStudentCardsData.payload.status === 'success') {
          this.unmatchedStudent = unmatchedStudentCardsData.payload.data;
        } else {
          payloadNotification(unmatchedStudentCardsData.payload);
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
    this.studentCardService.getValidatedStudentCards().subscribe({
      next: validatedStudentCardsData => {
        if (validatedStudentCardsData.payload.status === 'success') {
          this.validatedStudents = validatedStudentCardsData.payload.data;
        } else {
          payloadNotification(validatedStudentCardsData.payload);
        }
      },
      error: (err) => {
        // Si hay un error de red o del servidor
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
    this.studentCardService.getFlaggedStudentCards().subscribe({
      next: flaggedStudentCardsData => {
        if (flaggedStudentCardsData.payload.status === 'success') {
          this.flaggedStudents = flaggedStudentCardsData.payload.data;
        } else {
          payloadNotification(flaggedStudentCardsData.payload);
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
    const previousStatus = student.status;
    const payload = { id: student.id };
    const token = encodeArray(payload);
    this.studentCardService.validateStudentCard(token).subscribe({
      next: (data) => {
        if (data.payload.status === 'success') {
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
          payloadNotification(data.payload);
        } else if (data.payload.status === 'warning') {
          payloadNotification(data.payload)
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
    const previousStatus = student.status;
    const payload = { id: student.id };
    const statusStudentCard = encodeArray(payload);
    this.studentCardService.pendingStudentCard(statusStudentCard).subscribe({
      next: (data) => {
        if (data.payload.status === 'success') {
          // Si está validado, lo movemos de pendientes a validados
          this.pendingStudents.push(student);
          if (list === 'validated') {
            this.validatedStudents = this.validatedStudents.filter(s => s.id !== student.id);
          }
          if (list === 'flagged') {
            this.flaggedStudents = this.flaggedStudents.filter(s => s.id !== student.id);
          }
          this.notificationService.success(data.payload.title, data.payload.message);
        } else if (data.payload.status === 'warning') {
          student.status = previousStatus;
          payloadNotification(data.payload);
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


  downloadStudentPhoto(student: StudentCard) {
    const payload = { id: student.id };
    const statusStudentCard = encodeArray(payload);
    this.studentCardService.downloadStudentCardPhoto(statusStudentCard).subscribe({
      next: async (blob) => {
        try {
          // Intentar leerlo como JSON
          const text = await blob.text();
          const parsed = JSON.parse(text);

          // if (isApiResponse<any>(parsed)) {
          //   this.notificationService.warning(parsed.response.title, parsed.response.message);
          //   console.log(parsed.response.payload);
          //   return;
          // }
        } catch {
          const url = window.URL.createObjectURL(blob);
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

  downloadStudentCardsPDF() {
    this.studentCardService.downloadStudentCardsPDF().subscribe({
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
      error: (err) => {
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
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
      error: (err) => {
        this.notificationService.error('Error de conexión', 'No se pudo conectar con el servidor.');
        console.error(err);
      }
    });
  }

  downloadPhotosZip() {
    this.studentCardService.downloadStudentPhotosZip().subscribe({
      next: async (blob) => {
        try {
          const text = await (blob as Blob).text(); // 👈 le decimos a TS que es Blob
          const parsed = JSON.parse(text);
          // if (isApiResponse<any>(parsed)) {
          //   this.notificationService.warning(parsed.response.title, parsed.response.message);
          //   console.log(parsed.response.payload);
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
      error: () => {
        this.notificationService.error('Error de conexión', 'No se pudo descargar el archivo ZIP');
      }
    });
  }

  @ViewChild('overlayObservations') overlayObservations!: OverlayPanel;

  openObservationPanel(event: Event, student: StudentCard) {
    this.selectedFlags = [];
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

    const payload = {
      id: this.selectedFlaggedCard.id,
      flags: this.selectedFlags
    };

    let selectedFlagsData = encodeArray(payload);
    this.studentCardService.setFlaggedStudentCard(selectedFlagsData).subscribe({
      next: (data) => {
        if (data.payload.status === 'success') {
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
          payloadNotification(data.payload);
        } else {
          payloadNotification(data.payload);
        }
      }
    });
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
      this.notificationService.warning('Formato de foto', 'Solo se permiten archivos .jpg o .jpeg');
    }
  }

  onConfirmUploadPhoto(): void {
    const selectedFileUpload = this.fileUploader.files[0];
    if (!selectedFileUpload) {
      this.notificationService.warning('Sin foto', 'Por favor, seleccione una foto antes de continuar.');
      return;
    }
    const formData = new FormData();
    formData.append('photo', selectedFileUpload);
    formData.append('id', this.selectedUploadCard.id.toString());
    this.studentCardService.updateStudentPhoto(formData).subscribe({
      next: (data) => {
        if (data.payload.status === 'success') {
        //   // const studentCard = jwtDecode(data.payload.data) as StudentCard;
        //   const studentCard = decodeApiData(data);
        //   const previous = studentCard.photo_path;
        //   studentCard.photo_path = 'img/card-img.png';
        //   studentCard.photo_path = previous;
        //   this.validatedStudents.push(studentCard);
        //   this.flaggedStudents = this.flaggedStudents.filter(s => s.id !== studentCard.id);
        //   this.notificationService.success(data.payload.title, data.payload.message);
        // } else if (data.status === 'warning') {
        //   this.notificationService.warning(data.payload.title, data.payload.message);
        }
      },
      error: () => {
        this.notificationService.error('Error de conexión', 'No se pudo cargar la foto');
      }
    });
  }

  showOverlay(event: Event, student: StudentCard): void {
    this.previewUrl = 'img/card-img.png';
    this.selectedUploadCard = student;
    this.fileUploader.clear();
    this.overlayUploadPhoto.toggle(event);
  }

}
