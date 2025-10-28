import {Component, OnInit} from '@angular/core';
import {Card} from 'primeng/card';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {NgClass, UpperCasePipe} from '@angular/common';
import {CalendarModule} from 'primeng/calendar';
import {ButtonModule} from 'primeng/button';
import {Attendance} from '../../../models/attendance.model';
import {AttendanceService} from '../../../services/attendance.service';
import {NotificationService} from '../../../services/notification.service';
import {User} from '../../../models/login-user.model';
import {
  CircleAlertIcon,
  Fingerprint,
  IdCard,
  LucideAngularModule,
  LucideIconNode, MapPinCheck,
  ScanFace
} from 'lucide-angular';

@Component({
  selector: 'app-attendance-user',
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
    UpperCasePipe,
    LucideAngularModule,
  ],
  templateUrl: './attendance-user.component.html',
  styleUrl: './attendance-user.component.css'
})
export class AttendanceUserComponent implements OnInit{
  names = 'Empleado';
  today = new Date();
  number = '';
  dateRange: Date[] = [];
  attendances: Attendance[] = [];
  loading = false;

  showCalendar = false; // ✅ Flag para renderizar calendario después del ciclo inicial

  protected readonly MapPinCheck = MapPinCheck;

  constructor(
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    // Renderizar calendario después de la inicialización
    setTimeout(() => this.showCalendar = true, 0);
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData) as User;
      this.names = 'Hola ' + user.staff.names + "!";
      this.number = user.staff.number;
      this.loadAttendances()
    }
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

  getVerifyIcon(type: string): readonly LucideIconNode[]{
    switch (type?.toLowerCase()?.trim()) {
      case 'fingerprint': return Fingerprint;
      case 'face': return ScanFace;
      case 'card': return IdCard;
      default: return CircleAlertIcon;
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
      case 'face': return 'text-indigo-400';
      case 'card': return 'text-secondary';
      default: return 'text-indigo-400';
    }
  }
}
