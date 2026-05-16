import {Component, Input} from '@angular/core';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {CardModule} from 'primeng/card';
import {DividerModule} from 'primeng/divider';
import {Attendance} from '../../../../models/attendance.model';
import {AppLucideIconComponent} from '../../../../core/components/lucide-icon/lucide-icon.component';

interface AttendanceLocationGroup {
  campus: string;
  attendances: Attendance[];
}

interface AttendanceDayGroup {
  date: string;
  locations: AttendanceLocationGroup[];
}

@Component({
  selector: 'app-staff-attendance-cards',
  imports: [
    CardModule,
    DividerModule,
    NgClass,
    NgFor,
    NgIf,
    AppLucideIconComponent,
  ],
  templateUrl: './staff-attendance-cards.component.html',
  styleUrl: './staff-attendance-cards.component.css'
})
export class StaffAttendanceCardsComponent {
  @Input() emptyMessage = 'Aun no hay asistencias';

  attendanceDayGroups: AttendanceDayGroup[] = [];

  @Input() set attendances(value: Attendance[] | null | undefined) {
    this.attendanceDayGroups = this.groupAttendancesByDayAndCampus(value ?? []);
  }

  getVerifyIconName(type: string): string {
    switch (type?.toLowerCase()?.trim()) {
      case 'fingerprint': return 'fingerprint';
      case 'palm':
      case 'hand':
      case 'palma':
      case 'mano': return 'hand';
      case 'face': return 'scan-face';
      case 'card': return 'id-card';
      default: return 'circle-alert';
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
