import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ButtonDirective} from 'primeng/button';
import {Select} from 'primeng/select';
import {FormFieldComponent} from '../../../../core/components/form-field.component';
import {AttendanceService, ReportFilterOption} from '../../../../services/attendance.service';
import {NotificationService} from '../../../../services/notification.service';
import {STATUS} from '../../../../core/constants/api-status.constants';
import {NOTIFICATION_MESSAGE} from '../../../../core/constants/app-messages.constants';

interface FilterChoice {
  code: string;
  /** El nombre con cuántas personas tiene, para que se vea qué tan grande será el reporte. */
  text: string;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const FIRST_YEAR = 2022;

/**
 * Reporte mensual de asistencias de RRHH. Los filtros (tipo de personal, contrato o modalidad y oficina) salen de Core y son
 * opcionales: sin ninguno, el reporte incluye a todo el personal.
 */
@Component({
  selector: 'app-hr-report-attendance-component',
  imports: [FormsModule, ReactiveFormsModule, ButtonDirective, Select, FormFieldComponent],
  templateUrl: './hr-report-attendance-component.component.html',
  styleUrl: './hr-report-attendance-component.component.css'
})
export class HrReportAttendanceComponentComponent implements OnInit {
  yearOptions: { id: number; label: string }[] = [];
  monthOptions: { id: number; label: string }[] = [];
  profileTypeOptions: FilterChoice[] = [];
  contractOptions: FilterChoice[] = [];
  dependencyOptions: FilterChoice[] = [];
  reportForm!: FormGroup;
  downloading = false;

  constructor(
    private notificationService: NotificationService,
    private attendanceService: AttendanceService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    const now = new Date();

    this.reportForm = this.fb.group({
      id_month: [now.getMonth() + 1, Validators.required],
      id_year: [now.getFullYear(), Validators.required],
      profile_type: [null],
      contract_code: [null],
      dependency_code: [null],
    });

    this.yearOptions = Array.from({length: now.getFullYear() - FIRST_YEAR + 1}, (_, i) => ({id: FIRST_YEAR + i, label: String(FIRST_YEAR + i)}));
    this.updateMonthOptions(now.getFullYear());
    this.reportForm.get('id_year')?.valueChanges.subscribe((year: number) => this.updateMonthOptions(year));

    this.loadFilters();
  }

  /** En el año en curso solo se ofrecen los meses que ya empezaron. */
  private updateMonthOptions(year: number): void {
    const now = new Date();
    const last = year === now.getFullYear() ? now.getMonth() + 1 : 12;
    this.monthOptions = MONTHS.slice(0, last).map((label, i) => ({id: i + 1, label}));

    const selected = this.reportForm.get('id_month')?.value;
    if (selected !== null && selected > last) {
      this.reportForm.patchValue({id_month: last});
    }
  }

  private loadFilters(): void {
    this.attendanceService.reportFilters().subscribe({
      next: (res) => {
        if (res.status !== STATUS.success) {
          this.notificationService.notifyApiData(res);
          return;
        }

        const choices = (items: ReportFilterOption[]): FilterChoice[] =>
          items.map((item) => ({code: item.code, text: `${item.label} (${item.total})`}));

        this.profileTypeOptions = choices(res.payload.data.profile_types);
        this.contractOptions = choices(res.payload.data.contracts);
        this.dependencyOptions = choices(res.payload.data.dependencies);
      },
      error: () => {
        this.notificationService.error(NOTIFICATION_MESSAGE.error_connection.title, 'No se pudieron cargar los filtros del reporte.');
      },
    });
  }

  downloadReportExcel(): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    const values = this.reportForm.value;
    const formData = new FormData();
    formData.append('id_month', values.id_month);
    formData.append('id_year', values.id_year);

    for (const filter of ['profile_type', 'contract_code', 'dependency_code']) {
      if (values[filter]) {
        formData.append(filter, values[filter]);
      }
    }

    this.downloading = true;
    this.attendanceService.downloadConsolidatedExcel(formData).subscribe({
      next: async (blob) => {
        this.downloading = false;

        // Un aviso del servidor (por ejemplo «sin personal») llega como JSON en vez de un Excel: se muestra, no se descarga.
        const warning = await this.readWarning(blob as Blob);
        if (warning) {
          this.notificationService.warning(warning.title, warning.message);
          return;
        }

        const url = window.URL.createObjectURL(blob as Blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `asistencia_consolidada_${values.id_year}-${String(values.id_month).padStart(2, '0')}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (e) => {
        this.downloading = false;
        this.notificationService.error(NOTIFICATION_MESSAGE.error_connection.title, NOTIFICATION_MESSAGE.error_connection.message);
        console.error(e);
      },
    });
  }

  private async readWarning(blob: Blob): Promise<{ title: string; message: string } | null> {
    if (!blob.type.includes('json')) {
      return null;
    }

    try {
      const parsed = JSON.parse(await blob.text());
      return {title: parsed.payload?.title ?? 'Aviso', message: parsed.payload?.message ?? 'No se pudo generar el reporte.'};
    } catch {
      return null;
    }
  }
}
