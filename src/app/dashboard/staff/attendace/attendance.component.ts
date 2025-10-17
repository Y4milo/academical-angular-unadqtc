import {Component, OnInit} from '@angular/core';
import {Card} from "primeng/card";
import {DropdownModule} from "primeng/dropdown";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {LoginUser} from '../../../models/login-user.model';
import {AttendanceService} from '../../../services/attendance.service';
import {NotificationService} from '../../../services/notification.service';
import {Attendance} from '../../../models/attendance.model';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {CalendarModule} from 'primeng/calendar';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {NgClass, UpperCasePipe} from '@angular/common';

@Component({
  selector: 'app-attendace',
  imports: [
    Card,
    DropdownModule,
    ReactiveFormsModule,
    TableModule,
    ProgressSpinnerModule,
    NgClass,
    FormsModule,
    CalendarModule,
    ButtonModule,
    InputTextModule,
    UpperCasePipe,
  ],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceListComponent implements OnInit {
  user = 'Empleado';
  today = new Date();
  number = '';
  dateRange: Date[] = [];
  attendances: Attendance[] = [];
  loading = false;

  showCalendar = false; // ✅ Flag para renderizar calendario después del ciclo inicial

  constructor(
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    // Renderizar calendario después de la inicialización
    setTimeout(() => this.showCalendar = true, 0);
  }

  loadAttendances(startDate?: string, endDate?: string) {
    if (!this.number.trim()) {
      this.notificationService.warning('Atención','Debe ingresar el número de empleado o DNI.');
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('number', this.number);
    formData.append('start_date', startDate ?? this.formatDate(this.dateRange[0] ?? this.today));
    formData.append('end_date', endDate ?? this.formatDate(this.dateRange[1] ?? this.today));

    this.attendanceService.listAttendancesByNumber(formData).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          this.attendances = res.payload.data;
        } else {
          this.notificationService.notifyApiData(res);
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Error', 'Ocurrió un problema al cargar los registros.');
      },
    });
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getVerifyIcon(type: string): string {
    switch (type?.toLowerCase()?.trim()) {
      case 'fingerprint': return 'pi pi-bullseye';
      case 'face': return 'pi pi-face-smile';
      case 'card': return 'pi pi-id-card';
      default: return 'pi pi-question-circle text-warning';
    }
  }
  getVerifyName(type: string): string {
    switch (type?.toLowerCase()?.trim()) {
      case 'fingerprint': return 'HUELLA DIGITAL';
      case 'face': return 'ROSTRO';
      case 'card': return 'TARJETA';
      default: return 'DESCONOCIDO';
    }
  }
  getVerifyClass(type: string): string {
    switch (type?.toLowerCase()?.trim()) {
      case 'fingerprint': return 'text-primary';
      case 'face': return 'text-info';
      case 'card': return 'text-secondary';
      default: return 'text-warning';
    }
  }
}

