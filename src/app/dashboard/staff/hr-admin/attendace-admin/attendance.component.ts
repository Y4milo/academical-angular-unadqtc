import {Component, OnInit} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AttendanceService, StaffAttendancePerson} from '../../../../services/attendance.service';
import {NotificationService} from '../../../../services/notification.service';
import {Attendance} from '../../../../models/attendance.model';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {CalendarModule} from 'primeng/calendar';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {CardModule} from 'primeng/card';
import {DividerModule} from 'primeng/divider';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {
  CircleAlertIcon,
  Fingerprint,
  Hand,
  IdCard,
  LucideAngularModule,
  LucideIconNode,
  MapPinCheck,
  ScanFace
} from 'lucide-angular';
import {STATUS} from '../../../../core/constants/status';
import {NOTIFICATION_MESSAGE} from '../../../../core/constants/notification_message';
import {DatePicker} from 'primeng/datepicker';

interface AttendanceLocationGroup {
  campus: string;
  attendances: Attendance[];
}

interface AttendanceDayGroup {
  date: string;
  locations: AttendanceLocationGroup[];
}

// @ts-ignore
@Component({
  selector: 'app-attendace-admin',
  imports: [
    ReactiveFormsModule,
    TableModule,
    ProgressSpinnerModule,
    NgClass,
    NgFor,
    NgIf,
    FormsModule,
    CalendarModule,
    CardModule,
    DividerModule,
    ButtonModule,
    InputTextModule,
    LucideAngularModule,
    DatePicker,
  ],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceListComponent implements OnInit {
  user = 'Empleado';
  today = new Date();
  number = '';
  consultedStaff: StaffAttendancePerson | null = null;
  dateRange: Date[] = [];
  attendances: Attendance[] = [];
  attendanceDayGroups: AttendanceDayGroup[] = [];
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
    const selectedRange = this.getSelectedDateRange();
    const formData = new FormData();
    formData.append('number', this.number);
    formData.append('start_date', startDate ?? selectedRange.startDate);
    formData.append('end_date', endDate ?? selectedRange.endDate);

    this.attendanceService.listAttendancesByNumber(formData).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === STATUS.success) {
          this.consultedStaff = res.payload.data.staff;
          this.attendances = res.payload.data.attendances;
          this.attendanceDayGroups = this.groupAttendancesByDayAndCampus(this.attendances);
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
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getSelectedDateRange(): { startDate: string; endDate: string } {
    const start = this.dateRange[0] ?? this.today;
    const end = this.dateRange[1] ?? start;

    return {
      startDate: this.formatDate(start),
      endDate: this.formatDate(end),
    };
  }

  getVerifyIcon(type: string): readonly LucideIconNode[]{
    switch (type?.toLowerCase()?.trim()) {
      case 'fingerprint': return Fingerprint;
      case 'palm':
      case 'hand':
      case 'palma':
      case 'mano': return Hand;
      case 'face': return ScanFace;
      case 'card': return IdCard;
      default: return CircleAlertIcon;
    }
  }
  getVerifyName(type: string): string {
    switch (type?.toLowerCase()?.trim()) {
      case 'fingerprint': return 'HUELLA DIGITAL';
      case 'palm':
      case 'hand':
      case 'palma':
      case 'mano': return 'PALMA';
      case 'face': return 'ROSTRO';
      case 'card': return 'TARJETA';
      default: return 'DESCONOCIDO';
    }
  }
  getVerifyClass(type: string): string {
    switch (type?.toLowerCase()?.trim()) {
      case 'fingerprint': return 'attendance-method-fingerprint';
      case 'palm':
      case 'hand':
      case 'palma':
      case 'mano': return 'attendance-method-palm';
      case 'face': return 'attendance-method-face';
      case 'card': return 'attendance-method-card';
      default: return 'attendance-method-unknown';
    }
  }

  protected readonly MapPinCheck = MapPinCheck;

  private groupAttendancesByDayAndCampus(attendances: Attendance[]): AttendanceDayGroup[] {
    const dayMap = new Map<string, Attendance[]>();

    attendances.forEach((attendance) => {
      const [date] = attendance.punch_time.split(' ');
      const dayAttendances = dayMap.get(date) ?? [];
      dayAttendances.push(attendance);
      dayMap.set(date, dayAttendances);
    });

    return Array.from(dayMap.entries()).map(([date, dayAttendances]) => ({
      date,
      locations: this.buildOrderedLocationGroups(dayAttendances),
    }));
  }

  private sortAttendancesByTime(attendances: Attendance[]): Attendance[] {
    return [...attendances].sort((a, b) => a.punch_time.localeCompare(b.punch_time));
  }

  private buildOrderedLocationGroups(attendances: Attendance[]): AttendanceLocationGroup[] {
    return this.sortAttendancesByTime(attendances).reduce<AttendanceLocationGroup[]>((groups, attendance) => {
      const campus = this.normalizeCampusName(attendance.campus);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup?.campus === campus) {
        lastGroup.attendances.push(attendance);
        return groups;
      }

      groups.push({
        campus,
        attendances: [attendance],
      });

      return groups;
    }, []);
  }

  private normalizeCampusName(campus?: string): string {
    const value = (campus ?? 'Sin sede').trim();

    if (!value) {
      return 'Sin sede';
    }

    return value.toUpperCase();
  }

  protected downloadAttendancesExcel(startDate?: string, endDate?: string) {
    if (!this.number.trim()) {
      this.notificationService.warning('Atencion','Debe ingresar el numero de empleado o DNI.');
      return;
    }

    this.loading = true;
    const selectedRange = this.getSelectedDateRange();
    const formData = new FormData();
    formData.append('number', this.number);
    formData.append('start_date', startDate ?? selectedRange.startDate);
    formData.append('end_date', endDate ?? selectedRange.endDate);

    this.attendanceService.downloadAttendancesByNumberExcel(formData).subscribe({
      next: async (blob) => {
        this.loading = false;
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
          a.download = `asistencia_${this.number}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (e) => {
        this.loading = false;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }
}

