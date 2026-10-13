import {Component, OnInit} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AttendanceService, StaffAttendancePerson, StaffSearchResult} from '../../../../services/attendance.service';
import {NotificationService} from '../../../../services/notification.service';
import {Attendance} from '../../../../models/attendance.model';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {CalendarModule} from 'primeng/calendar';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent} from 'primeng/autocomplete';
import {TagModule} from 'primeng/tag';
import {MessageModule} from 'primeng/message';
import {NgIf} from '@angular/common';
import {STATUS} from '../../../../core/constants/api-status.constants';
import {NOTIFICATION_MESSAGE} from '../../../../core/constants/app-messages.constants';
import {DatePicker} from 'primeng/datepicker';
import {StaffAttendanceCardsComponent} from '../../shared/staff-attendance-cards/staff-attendance-cards.component';

// @ts-ignore
@Component({
  selector: 'app-attendace-admin',
  imports: [
    ReactiveFormsModule,
    TableModule,
    ProgressSpinnerModule,
    NgIf,
    FormsModule,
    CalendarModule,
    ButtonModule,
    InputTextModule,
    AutoCompleteModule,
    TagModule,
    MessageModule,
    DatePicker,
    StaffAttendanceCardsComponent,
  ],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceListComponent implements OnInit {
  user = 'Empleado';
  today = new Date();
  number = '';
  /** Lo que se escribe en el buscador: un DNI (o su inicio) o parte del nombre. */
  query = '';
  suggestions: StaffSearchResult[] = [];
  /** true después de la primera consulta: sirve para distinguir «no existe» de «sin marcaciones». */
  searched = false;
  consultedStaff: StaffAttendancePerson | null = null;
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

  /** Qué decir cuando no hay marcaciones: no es lo mismo una persona que no existe que una sin marcaciones en esas fechas. */
  get emptyMessage(): string {
    if (!this.searched) {
      return 'Busque una persona por DNI o por nombre';
    }

    return this.consultedStaff
      ? 'Sin marcaciones en esas fechas'
      : 'No se encontró personal con ese DNI';
  }

  searchStaff(event: AutoCompleteCompleteEvent): void {
    this.attendanceService.searchStaff(event.query).subscribe({
      next: (res) => {
        this.suggestions = res.status === STATUS.success ? res.payload.data : [];
      },
      error: () => {
        this.suggestions = [];
      },
    });
  }

  onQueryChange(value: string | StaffSearchResult): void {
    if (typeof value === 'string') {
      this.number = value.trim();
    }
  }

  onStaffSelected(event: AutoCompleteSelectEvent): void {
    const selected = event.value as StaffSearchResult;
    this.number = selected.dni;
    this.query = selected.dni;
    this.loadAttendances();
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
          this.searched = true;
          this.attendances = res.payload.data.attendances;
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

