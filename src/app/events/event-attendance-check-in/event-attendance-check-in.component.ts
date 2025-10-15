import {Component, NgModule, OnInit} from '@angular/core';
import {AttendanceService} from '../../services/attendance.service';
import {NotificationService} from '../../services/notification.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {MessageModule} from 'primeng/message';
import {Card} from 'primeng/card';
import {ApiData} from '../../models/api/api-data.model';
import {EventAttendance} from '../../models/event-attendance.model';
import {ActivatedRoute} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-event-attendance-check-in',
  templateUrl: 'event-attendance-check-in.component.html',
  styleUrls: ['event-attendance-check-in.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MessageModule,
    InputTextModule,
    ButtonModule,
    FormsModule,
    Card,
  ]
})
export class EventAttendanceCheckInComponent implements OnInit {
  number: string = '';
  response: ApiData<EventAttendance> | undefined;
  eventDateId!: number;

  // Variables para mostrar resultados
  errors: any = null;

  constructor(
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // 🔍 Captura el parámetro 'id' desde la URL
    this.eventDateId = Number(this.route.snapshot.paramMap.get('id'));

    console.log('📅 ID del evento recibido:', this.eventDateId);
  }

  /**
   * Detects fast input (barcode scanner) or Enter key press
   */
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchParticipant();
    }
  }

  /**
   * Executes participant search by document number
   */
  searchParticipant(): void {
    if (!this.number.trim()) {
      this.notificationService.warning('Campo vacío', 'Debe ingresar un número de documento.');
      return;
    }

    const formData = new FormData();
    formData.append('number', this.number);
    formData.append('event_date_id', this.eventDateId.toString());

    this.attendanceService.storeAttendancePerson(formData).subscribe({
      next: (res) => {

          this.response = res;


          this.notificationService.notifyApiData(res);

        this.number = '';
      },
      error: (err: any) => {
        this.notificationService.error('Error', 'Ocurrió un error al procesar la asistencia.');
        console.error(err);
      },
    });
  }
}
