import {Component, OnInit} from '@angular/core';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {NgIf} from '@angular/common';
import {CalendarModule} from 'primeng/calendar';
import {ButtonModule} from 'primeng/button';
import {Attendance} from '../../../../models/attendance.model';
import {AttendanceService} from '../../../../services/attendance.service';
import {NotificationService} from '../../../../services/notification.service';
import {StaffUser} from '../../../../models/staff-user.model';
import {DatePicker} from 'primeng/datepicker';
import {NOTIFICATION_MESSAGE} from '../../../../core/constants/app-messages.constants';
import {STATUS} from '../../../../core/constants/api-status.constants';
import {StaffAttendanceCardsComponent} from '../../shared/staff-attendance-cards/staff-attendance-cards.component';

@Component({
  selector: 'app-attendance-user',
  imports: [
    DropdownModule,
    ReactiveFormsModule,
    ProgressSpinnerModule,
    NgIf,
    FormsModule,
    CalendarModule,
    ButtonModule,
    DatePicker,
    StaffAttendanceCardsComponent,
  ],
  templateUrl: './attendance-user.component.html',
  styleUrl: './attendance-user.component.css'
})
export class AttendanceUserComponent implements OnInit {
  names = 'Empleado';
  today = new Date();
  dateRange: Date[] = [new Date()];
  attendances: Attendance[] = [];
  loading = false;
  showCalendar = false;

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

}
