import {Component, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {DatePickerModule} from 'primeng/datepicker';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {InputTextModule} from 'primeng/inputtext';
import {MessageModule} from 'primeng/message';
import {SelectModule} from 'primeng/select';
import {SelectButtonModule} from 'primeng/selectbutton';
import {SkeletonModule} from 'primeng/skeleton';
import {TableLazyLoadEvent, TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {TooltipModule} from 'primeng/tooltip';
import {Subject, debounceTime} from 'rxjs';
import {
  AttendanceService,
  ManualAttendanceListFilters,
  ManualAttendanceListResponse,
  ManualAttendanceListRow,
} from '../../../../services/attendance.service';
import {DictionaryService} from '../../../../services/dictionary.service';
import {NotificationService} from '../../../../services/notification.service';
import {Dictionary} from '../../../../models/dictionary.model';
import {STATUS} from '../../../../core/constants/api-status.constants';
import {AppLucideIconComponent} from '../../../../core/components/lucide-icon/lucide-icon.component';

type Preset = 'today' | 'week' | 'month' | 'previous_month';
type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

interface Choice<T> {
  label: string;
  value: T;
}

/**
 * Auditoría de las asistencias registradas a mano (lector de barras o DNI digitado) de todo el personal: cuándo, en qué sede, con qué
 * motivo y quién las registró. Solo admin y RRHH.
 */
@Component({
  selector: 'app-attendance-manual-list',
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    SelectButtonModule,
    SkeletonModule,
    TableModule,
    TagModule,
    TooltipModule,
    AppLucideIconComponent,
  ],
  templateUrl: './attendance-manual-list.component.html',
  styleUrl: './attendance-manual-list.component.css',
})
export class AttendanceManualListComponent implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly dictionaryService = inject(DictionaryService);
  private readonly notifications = inject(NotificationService);
  private readonly search$ = new Subject<void>();

  readonly today = new Date();
  readonly pageSizes = [10, 20, 50];
  readonly presetOptions: Choice<Preset>[] = [
    {label: 'Hoy', value: 'today'},
    {label: 'Esta semana', value: 'week'},
    {label: 'Este mes', value: 'month'},
    {label: 'Mes anterior', value: 'previous_month'},
  ];
  readonly sourceOptions: Choice<'barcode' | 'keyboard'>[] = [
    {label: 'Lector de barras', value: 'barcode'},
    {label: 'DNI digitado', value: 'keyboard'},
  ];

  campuses: Dictionary[] = [];
  registrars: {id: number; name: string}[] = [];

  activePreset: Preset | null = 'month';
  dateRange: Date[] = [];
  campusId: number | null = null;
  registeredBy: number | null = null;
  source: 'barcode' | 'keyboard' | null = null;
  query = '';

  rows: ManualAttendanceListRow[] = [];
  total = 0;
  first = 0;
  perPage = 10;
  summary: ManualAttendanceListResponse['summary'] = {total: 0, people: 0, barcode: 0, keyboard: 0};

  loading = true;
  failed = false;
  downloading = false;

  ngOnInit(): void {
    this.applyPreset('month', false);

    this.dictionaryService.getCampusList().subscribe({
      next: (res) => (this.campuses = res.payload?.data ?? []),
    });
    this.attendanceService.manualRegistrars().subscribe({
      next: (res) => (this.registrars = res.status === STATUS.success ? res.payload.data : []),
    });
    this.search$.pipe(debounceTime(400)).subscribe(() => this.search());

    this.fetch();
  }

  applyPreset(preset: Preset | null, reload = true): void {
    this.activePreset = preset;
    if (!preset) {
      return;
    }

    const now = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    const monday = now.getDate() - ((now.getDay() + 6) % 7);

    switch (preset) {
      case 'today': this.dateRange = [now, now]; break;
      case 'week': this.dateRange = [new Date(now.getFullYear(), now.getMonth(), monday), now]; break;
      case 'month': this.dateRange = [new Date(now.getFullYear(), now.getMonth(), 1), now]; break;
      case 'previous_month': this.dateRange = [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)]; break;
    }

    if (reload) {
      this.search();
    }
  }

  onRangeSelect(): void {
    this.activePreset = null;
    if (this.dateRange[0] && this.dateRange[1]) {
      this.search();
    }
  }

  onQueryInput(): void {
    this.search$.next();
  }

  /** Cualquier cambio de filtro vuelve a la primera página. */
  search(): void {
    this.first = 0;
    this.fetch();
  }

  clearFilters(): void {
    this.campusId = null;
    this.registeredBy = null;
    this.source = null;
    this.query = '';
    this.applyPreset('month');
  }

  get hasFilters(): boolean {
    return this.campusId !== null || this.registeredBy !== null || this.source !== null || this.query.trim() !== '' || this.activePreset !== 'month';
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.perPage;

    if (first === this.first && rows === this.perPage) {
      return;
    }

    this.first = first;
    this.perPage = rows;
    this.fetch();
  }

  fetch(): void {
    const start = this.dateRange[0];
    const end = this.dateRange[1] ?? start;

    if (!start) {
      return;
    }

    this.loading = true;
    this.failed = false;

    this.attendanceService.manualList({...this.filters(start, end), page: Math.floor(this.first / this.perPage) + 1, per_page: this.perPage}).subscribe({
      next: (res) => {
        this.loading = false;

        if (res.status !== STATUS.success) {
          this.failed = true;
          this.notifications.notifyApiData(res);
          return;
        }

        this.rows = res.payload.data.rows;
        this.total = res.payload.data.meta.total;
        this.summary = res.payload.data.summary;
      },
      error: () => {
        this.loading = false;
        this.failed = true;
      },
    });
  }

  downloadExcel(): void {
    const start = this.dateRange[0];
    const end = this.dateRange[1] ?? start;

    if (!start || this.downloading) {
      return;
    }

    this.downloading = true;
    this.attendanceService.downloadManualExcel(this.filters(start, end)).subscribe({
      next: (blob) => {
        this.downloading = false;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `asistencias_manuales_${this.iso(start)}_${this.iso(end)}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading = false;
        this.notifications.error('Error', 'No se pudo descargar el Excel. Intente de nuevo.');
      },
    });
  }

  /** Verde si fue puntual, rojo fuera de tolerancia, ámbar para lo demás que merece una mirada. */
  statusSeverity(status: string | null): TagSeverity {
    switch (status) {
      case 'on_time': return 'success';
      case 'beyond_tolerance': return 'danger';
      case null: return 'secondary';
      default: return 'warn';
    }
  }

  typeSeverity(type: string | null): TagSeverity {
    return type === 'teacher' ? 'info' : 'secondary';
  }

  private filters(start: Date, end: Date): ManualAttendanceListFilters {
    return {
      start_date: this.iso(start),
      end_date: this.iso(end),
      campus_id: this.campusId,
      registered_by: this.registeredBy,
      source: this.source,
      search: this.query.trim() || null,
    };
  }

  private iso(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
