import {Component, OnInit, ViewChild} from '@angular/core';
import {StudentCard} from '../../../../models/student/student-card.model';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {StudentCardService} from '../../../../services/student-card.service';
import {NotificationService} from '../../../../services/notification.service';
import {environment} from '../../../../../environments/environment';
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
  storageURL = environment.storage + '/';
  statusStudentCardOptions: Dictionary[] = [];
  selectedFlags: Dictionary[] = [];
  selectedFlaggedCard?: StudentCard;
  showSelectError: boolean = false;
  previewUrl: string = 'img/card-img.png';
  selectedUploadCard!: StudentCard;
  private observationsMultiSelectTimer?: ReturnType<typeof setTimeout>;
  constructor(
    private studentCardService: StudentCardService,
    private dictionaryService: DictionaryService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.dictionaryService.getStudentCardFlags().subscribe({
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
    this.studentCardService.getPendingStudentCards().subscribe({
      next: pendingStudentCardsData => {
        if (pendingStudentCardsData.status === STATUS.success) {
          this.pendingStudents = pendingStudentCardsData.payload.data;
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
    this.studentCardService.getUnmatchedStudentCards().subscribe({
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
    this.studentCardService.getValidatedStudentCards().subscribe({
      next: validatedStudentCardsData => {
        if (validatedStudentCardsData.status === STATUS.success) {
          this.validatedStudents = validatedStudentCardsData.payload.data;
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
    this.studentCardService.getFlaggedStudentCards().subscribe({
      next: flaggedStudentCardsData => {
        if (flaggedStudentCardsData.status === STATUS.success) {
          this.flaggedStudents = flaggedStudentCardsData.payload.data;
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


  downloadStudentPhoto(student: StudentCard) {
    const payload = new FormData();
    payload.append('id', student.id.toString());
    this.studentCardService.downloadStudentCardPhoto(payload).subscribe({
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
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
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
}
