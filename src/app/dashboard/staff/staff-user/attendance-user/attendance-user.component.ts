import {Component, OnInit} from '@angular/core';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {CalendarModule} from 'primeng/calendar';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {DividerModule} from 'primeng/divider';
import {Attendance} from '../../../../models/attendance.model';
import {AttendanceService} from '../../../../services/attendance.service';
import {NotificationService} from '../../../../services/notification.service';
import {StaffUser} from '../../../../models/staff-user.model';
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
import {DatePicker} from 'primeng/datepicker';
import {NOTIFICATION_MESSAGE} from '../../../../core/constants/notification_message';
import {STATUS} from '../../../../core/constants/status';

interface AttendanceLocationGroup {
  campus: string;
  attendances: Attendance[];
}

interface AttendanceDayGroup {
  date: string;
  locations: AttendanceLocationGroup[];
}

@Component({
  selector: 'app-attendance-user',
  imports: [
    DropdownModule,
    ReactiveFormsModule,
    ProgressSpinnerModule,
    NgClass,
    NgFor,
    NgIf,
    FormsModule,
    CalendarModule,
    ButtonModule,
    CardModule,
    DividerModule,
    LucideAngularModule,
    DatePicker,
  ],
  templateUrl: './attendance-user.component.html',
  styleUrl: './attendance-user.component.css'
})
export class AttendanceUserComponent implements OnInit {
  names = 'Empleado';
  today = new Date();
  dateRange: Date[] = [new Date()];
  attendances: Attendance[] = [];
  attendanceDayGroups: AttendanceDayGroup[] = [];
  loading = false;
  showCalendar = false;

  protected readonly MapPinCheck = MapPinCheck;

  constructor(
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    setTimeout(() => this.showCalendar = true, 0);

    const userData = sessionStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData) as StaffUser;
      this.names = user.staff?.names ?? 'Empleado';
    }

    this.loadAttendances();
  }

  loadAttendances(startDate?: string, endDate?: string) {
    this.loading = true;
    const selectedRange = this.getSelectedDateRange();

    const formData = new FormData();
    formData.append('start_date', startDate ?? selectedRange.startDate);
    formData.append('end_date', endDate ?? selectedRange.endDate);

    this.attendanceService.myAttendances(formData).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === STATUS.success) {
          this.attendances = res.payload.data;
          this.attendanceDayGroups = this.groupAttendancesByDayAndCampus(this.attendances);
        } else {
          this.notificationService.notifyApiData(res);
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

  private getLimaDateOnly(date?: Date): string {
    const now = date ? new Date(date) : new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getSelectedDateRange(): { startDate: string; endDate: string } {
    const start = this.dateRange[0] ?? this.today;
    const end = this.dateRange[1] ?? start;

    return {
      startDate: this.getLimaDateOnly(start),
      endDate: this.getLimaDateOnly(end),
    };
  }

  formatDate(date: Date): string {
    return this.getLimaDateOnly(date);
  }

  getVerifyIcon(type: string): readonly LucideIconNode[] {
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
}
