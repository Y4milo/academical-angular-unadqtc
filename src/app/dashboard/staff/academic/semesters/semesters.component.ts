import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { FormFieldComponent } from '../../../../core/components/form-field.component';
import { StatusTagComponent } from '../../../../core/components/status-tag.component';
import { dateToIso, isoToDate } from '../../../../core/utils/date-input.util';
import { ApiData } from '../../../../models/api/api-data.model';
import { NotificationService } from '../../../../services/notification.service';
import { Semester, SemesterState, SemestersPayload, SemestersService } from '../../../../services/semesters.service';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

export const SEMESTER_STATE_LABELS: Record<SemesterState, string> = { draft: 'Borrador', enabled: 'Habilitado', current: 'Vigente', finished: 'Finalizado' };

const STATE_SEVERITY: Record<SemesterState, Severity> = { draft: 'warn', enabled: 'info', current: 'success', finished: 'secondary' };

/** Semestres: se crean en borrador, se habilitan y, al llegar su fecha, quedan vigentes. Solo administrador y académico. */
@Component({
  selector: 'app-semesters',
  imports: [DatePipe, FormsModule, ButtonModule, DatePickerModule, DialogModule, InputTextModule, MessageModule, SkeletonModule, TableModule, AppLucideIconComponent, FormFieldComponent, StatusTagComponent],
  templateUrl: './semesters.component.html',
  styleUrl: './semesters.component.css',
})
export class SemestersComponent implements OnInit {
  readonly semesters = signal<Semester[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly skeletonRows = [0, 1, 2];

  dialogVisible = false;
  editing: Semester | null = null;
  name = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  formError = '';
  working = false;
  busyId: number | null = null;

  constructor(private service: SemestersService, private notifications: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.list().subscribe({
      next: response => {
        this.semesters.set(response.payload.data?.semesters ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  stateLabel(state: SemesterState): string {
    return SEMESTER_STATE_LABELS[state];
  }

  stateSeverity(state: SemesterState): Severity {
    return STATE_SEVERITY[state];
  }

  canEdit(semester: Semester): boolean {
    return semester.state === 'draft' || semester.state === 'enabled';
  }

  openCreate(): void {
    this.editing = null;
    this.name = '';
    this.startDate = null;
    this.endDate = null;
    this.formError = '';
    this.dialogVisible = true;
  }

  openEdit(semester: Semester): void {
    this.editing = semester;
    this.name = semester.name;
    this.startDate = isoToDate(semester.start_date);
    this.endDate = isoToDate(semester.end_date);
    this.formError = '';
    this.dialogVisible = true;
  }

  save(): void {
    this.formError = '';
    if (!this.editing && !/^\d{4}-(I|II|III)$/i.test(this.name.trim())) {
      this.formError = 'El nombre debe tener la forma 2027-I, 2027-II o 2027-III.';
      return;
    }
    if (!this.startDate || !this.endDate) {
      this.formError = 'Elige el inicio y el fin de la vigencia.';
      return;
    }
    const start = dateToIso(this.startDate);
    const end = dateToIso(this.endDate);
    if (end <= start) {
      this.formError = 'El fin de la vigencia debe ser posterior al inicio.';
      return;
    }

    this.working = true;
    const request = this.editing
      ? this.service.update(this.editing.id, start, end)
      : this.service.create(this.name.trim(), start, end);

    request.subscribe({
      next: response => {
        this.working = false;
        if (response.status !== 'success') {
          this.formError = response.payload.message;
          return;
        }
        this.semesters.set(response.payload.data?.semesters ?? this.semesters());
        this.dialogVisible = false;
        this.notifications.success(response.payload.title, response.payload.message);
      },
      error: () => {
        this.working = false;
        this.formError = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.';
      },
    });
  }

  enable(semester: Semester): void {
    this.act(semester, this.service.enable(semester.id));
  }

  backToDraft(semester: Semester): void {
    this.act(semester, this.service.backToDraft(semester.id));
  }

  private act(semester: Semester, request: Observable<ApiData<SemestersPayload>>): void {
    this.busyId = semester.id;
    request.subscribe({
      next: response => {
        this.busyId = null;
        if (response.status !== 'success') {
          this.notifications.error(response.payload.title, response.payload.message);
          return;
        }
        this.semesters.set(response.payload.data?.semesters ?? this.semesters());
        this.notifications.success(response.payload.title, response.payload.message);
      },
      error: () => {
        this.busyId = null;
        this.notifications.error('No se pudo completar', 'Revisa tu conexión e inténtalo de nuevo.');
      },
    });
  }
}
