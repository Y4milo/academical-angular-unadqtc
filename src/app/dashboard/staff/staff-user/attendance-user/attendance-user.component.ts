import {Component, OnInit} from '@angular/core';
import {Card} from 'primeng/card';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {NgClass, UpperCasePipe} from '@angular/common';
import {CalendarModule} from 'primeng/calendar';
import {ButtonModule} from 'primeng/button';
import {Attendance} from '../../../../models/attendance.model';
import {AttendanceService} from '../../../../services/attendance.service';
import {NotificationService} from '../../../../services/notification.service';
import {StaffUser} from '../../../../models/staff-user.model';
import {
  CircleAlertIcon,
  Fingerprint,
  IdCard,
  LucideAngularModule,
  LucideIconNode, MapPinCheck,
  ScanFace
} from 'lucide-angular';
import {DatePicker} from 'primeng/datepicker';
import {NOTIFICATION_MESSAGE} from '../../../../core/constants/notification_message';
import {STATUS} from '../../../../core/constants/status';

@Component({
  selector: 'app-attendance-user',
  imports: [
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
    DatePicker,
  ],
  templateUrl: './attendance-user.component.html',
  styleUrl: './attendance-user.component.css'
})
export class AttendanceUserComponent implements OnInit{
  names = 'Empleado';
  today = new Date();
  number = '';
  dateRange: Date[] = [new Date()];
  attendances: Attendance[] = [];
  loading = false;

  showCalendar = false; // ✅ Flag para renderizar calendario después del ciclo inicial

  protected readonly MapPinCheck = MapPinCheck;

  constructor(
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    // set spanish language for datepicker

    // Renderizar calendario después de la inicialización
    setTimeout(() => this.showCalendar = true, 0);
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData) as StaffUser;
      this.names = user.staff.names;
      this.number = user.staff.number;
      this.loadAttendances()
    }
  }

  loadAttendances(startDate?: string, endDate?: string) {
    if (!this.number.trim()) {
      this.notificationService.warning('Atención', 'Debe ingresar el número de empleado o DNI.');
      return;
    }

    this.loading = true;

    // Función para obtener la fecha de Lima en formato YYYY-MM-DD
    const getLimaDate = (date?: Date): string => {
      const now = date ? new Date(date) : new Date();
      // Convertir a UTC y luego restar 5 horas (Lima = UTC-5)
      const limaTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
      const year = limaTime.getUTCFullYear();
      const month = (limaTime.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = limaTime.getUTCDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formData = new FormData();
    formData.append('number', this.number);
    formData.append('start_date', startDate ?? getLimaDate(this.dateRange[0] ?? this.today));
    formData.append('end_date', endDate ?? getLimaDate(this.dateRange[1] ?? this.today));

    this.attendanceService.listAttendancesByNumber(formData).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === STATUS.success) {
          this.attendances = res.payload.data;
        } else {
          this.notificationService.notifyApiData(res);
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

  /**
   * 🕒 Convierte una fecha al formato "YYYY-MM-DD HH:mm:ss" en hora de Lima (UTC−5)
   */
  private getLimaDate(date: Date, type: 'start' | 'end'): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    // Generar la fecha exacta en hora de Lima
    const [month, day, year] = new Intl.DateTimeFormat('en-US', options)
      .format(date)
      .split('/');

    // Definir hora de inicio o fin del día
    const time = type === 'start' ? '00:00:00' : '23:59:59';

    return `${year}-${month}-${day} ${time}`;
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
