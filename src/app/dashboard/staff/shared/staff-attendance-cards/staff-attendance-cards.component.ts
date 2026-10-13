import {Component, Input} from '@angular/core';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CardModule} from 'primeng/card';
import {DividerModule} from 'primeng/divider';
import {SelectModule} from 'primeng/select';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {MessageModule} from 'primeng/message';
import {TagModule} from 'primeng/tag';
import {TimelineModule} from 'primeng/timeline';
import {SelectButtonModule} from 'primeng/selectbutton';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {TooltipModule} from 'primeng/tooltip';
import {PaginatorModule, PaginatorState} from 'primeng/paginator';
import {Attendance} from '../../../../models/attendance.model';
import {AppLucideIconComponent} from '../../../../core/components/lucide-icon/lucide-icon.component';

interface AttendanceLocationGroup {
  campus: string;
  attendances: Attendance[];
}

interface AttendanceDayGroup {
  date: string;
  day: string;
  weekday: string;
  month: string;
  /** Primera y última marcación del día, «06:56 – 20:27». */
  range: string;
  count: number;
  locations: AttendanceLocationGroup[];
}

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

interface Choice {
  label: string;
  value: string;
}

type MethodKey = 'fingerprint' | 'palm' | 'face' | 'card' | 'password' | 'manual' | 'unknown';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

const METHODS: Record<MethodKey, { name: string; icon: string; severity: TagSeverity }> = {
  fingerprint: {name: 'HUELLA DIGITAL', icon: 'fingerprint', severity: 'success'},
  palm: {name: 'PALMA', icon: 'hand', severity: 'success'},
  face: {name: 'ROSTRO', icon: 'scan-face', severity: 'info'},
  card: {name: 'TARJETA', icon: 'id-card', severity: 'info'},
  password: {name: 'CONTRASEÑA', icon: 'lock', severity: 'info'},
  manual: {name: 'MANUAL', icon: 'clipboard-pen', severity: 'warn'},
  unknown: {name: 'DESCONOCIDO', icon: 'circle-alert', severity: 'secondary'},
};

const ROLES: Record<string, { name: string; short: string; icon: string; cssClass: string }> = {
  entry: {short: 'Entrada', name: 'Entrada', icon: 'log-in', cssClass: 'attendance-role-entry'},
  lunch_out: {short: 'A almuerzo', name: 'Salida a almuerzo', icon: 'utensils', cssClass: 'attendance-role-lunch'},
  lunch_in: {short: 'De almuerzo', name: 'Regreso de almuerzo', icon: 'rotate-ccw', cssClass: 'attendance-role-lunch'},
  exit: {short: 'Salida', name: 'Salida', icon: 'log-out', cssClass: 'attendance-role-exit'},
  extra: {short: 'Repetida', name: 'Repetida', icon: 'copy', cssClass: 'attendance-role-middle'},
};

/**
 * Las marcaciones de una persona, agrupadas por día y sede: de cada una se ve si fue entrada, salida a almuerzo, regreso de almuerzo
 * o salida, y con qué método (huella, rostro, manual...). Tiene filtros (sede, método, tipo), búsqueda y paginación por días.
 */
@Component({
  selector: 'app-staff-attendance-cards',
  imports: [
    CardModule,
    DividerModule,
    SelectModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
    TagModule,
    TimelineModule,
    SelectButtonModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    PaginatorModule,
    FormsModule,
    NgClass,
    NgFor,
    NgIf,
    AppLucideIconComponent,
  ],
  templateUrl: './staff-attendance-cards.component.html',
  styleUrl: './staff-attendance-cards.component.css'
})
export class StaffAttendanceCardsComponent {
  @Input() emptyTitle = 'Sin marcaciones';
  @Input() emptyMessage = 'Aun no hay asistencias';
  /** Muestra el motivo y quién registró una marcación manual: solo para admin y RRHH. */
  @Input() showDetails = false;

  @Input() set attendances(value: Attendance[] | null | undefined) {
    this.all = value ?? [];
    this.campusOptions = this.distinct(this.all.map((item) => this.campusName(item.campus)));
    this.methodOptions = this.distinct(this.all.map((item) => this.methodKey(item)), (key) => METHODS[key as MethodKey].name);
    this.clearFilters();
  }

  readonly roleOptions: Choice[] = Object.entries(ROLES).map(([value, role]) => ({label: role.short, value}));
  readonly pageSizes = [6, 12, 24];

  campusOptions: Choice[] = [];
  methodOptions: Choice[] = [];

  campus: string | null = null;
  method: string | null = null;
  role: string | null = null;
  query = '';

  first = 0;
  rows = 12;

  /** Los días que cumplen los filtros (todos) y los de la página que se muestra. */
  filteredDays: AttendanceDayGroup[] = [];
  pageDays: AttendanceDayGroup[] = [];
  matchingMarks = 0;
  manualMarks = 0;

  private all: Attendance[] = [];

  get hasFilters(): boolean {
    return this.campus !== null || this.method !== null || this.role !== null || this.query.trim() !== '';
  }

  get totalMarks(): number {
    return this.all.length;
  }

  applyFilters(): void {
    const query = this.query.trim().toLowerCase();

    const matching = this.all.filter((item) =>
      (this.campus === null || this.campusName(item.campus) === this.campus)
      && (this.method === null || this.methodKey(item) === this.method)
      && (this.role === null || item.day_role === this.role)
      && (query === '' || this.searchableText(item).includes(query)));

    this.matchingMarks = matching.length;
    this.manualMarks = matching.filter((item) => this.methodKey(item) === 'manual').length;
    this.filteredDays = this.groupAttendancesByDayAndCampus(matching);
    this.first = 0;
    this.updatePage();
  }

  clearFilters(): void {
    this.campus = null;
    this.method = null;
    this.role = null;
    this.query = '';
    this.applyFilters();
  }

  onPageChange(event: PaginatorState): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
    this.updatePage();
  }

  methodKey(item: Attendance): MethodKey {
    if (item.is_manual || (item.source && item.source !== 'clock')) {
      return 'manual';
    }

    switch (item.verify_type?.toLowerCase()?.trim()) {
      case 'fingerprint': return 'fingerprint';
      case 'palm':
      case 'hand':
      case 'palma':
      case 'mano': return 'palm';
      case 'face': return 'face';
      case 'card': return 'card';
      case 'password': return 'password';
      default: return 'unknown';
    }
  }

  methodView(item: Attendance) {
    return METHODS[this.methodKey(item)];
  }

  /** Cómo se hizo un registro manual, para el texto emergente. */
  manualDetail(item: Attendance): string | null {
    if (this.methodKey(item) !== 'manual') {
      return null;
    }

    return item.source === 'barcode' ? 'Registro manual con lector de barras' : item.source === 'keyboard' ? 'Registro manual con el DNI digitado' : 'Registro manual';
  }

  roleView(item: Attendance) {
    return item.day_role ? ROLES[item.day_role] ?? null : null;
  }

  /** Color del texto «qué marcación fue»: verde si fue puntual, ámbar si hay algo que mirar, rojo fuera de tolerancia. */
  getPunchClass(status?: string | null): string {
    switch (status) {
      case 'on_time': return 'attendance-punch-ok';
      case 'beyond_tolerance': return 'attendance-punch-bad';
      default: return 'attendance-punch-warn';
    }
  }

  private updatePage(): void {
    this.pageDays = this.filteredDays.slice(this.first, this.first + this.rows);
  }

  private searchableText(item: Attendance): string {
    return [
      item.punch_time, item.campus, this.methodView(item).name, this.roleView(item)?.name, item.punch_label,
      this.showDetails ? item.reason : null, this.showDetails ? item.registered_by : null,
    ].filter(Boolean).join(' ').toLowerCase();
  }

  private distinct(values: string[], label?: (value: string) => string): Choice[] {
    return Array.from(new Set(values))
      .map((value) => ({label: label ? label(value) : value, value}))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private campusName(campus?: string): string {
    const value = (campus ?? 'Sin sede').trim();

    return value ? value.toUpperCase() : 'SIN SEDE';
  }

  private groupAttendancesByDayAndCampus(attendances: Attendance[]): AttendanceDayGroup[] {
    const dayMap = new Map<string, Attendance[]>();

    attendances.forEach((attendance) => {
      const [date] = attendance.punch_time.split(' ');
      const dayAttendances = dayMap.get(date) ?? [];
      dayAttendances.push(attendance);
      dayMap.set(date, dayAttendances);
    });

    return Array.from(dayMap.entries()).map(([date, dayAttendances]) => {
      const [dd, mm, yyyy] = date.split('/').map(Number);
      const weekday = WEEKDAYS[new Date(yyyy, mm - 1, dd).getDay()] ?? '';
      const times = dayAttendances.map((item) => item.punch_time.split(' ')[1].slice(0, 5)).sort();
      const range = times.length > 1 && times[0] !== times[times.length - 1] ? `${times[0]} – ${times[times.length - 1]}` : times[0];

      return {
        date,
        day: String(dd).padStart(2, '0'),
        weekday,
        month: `${MONTHS[mm - 1] ?? ''} ${yyyy}`,
        range,
        count: dayAttendances.length,
        locations: this.buildOrderedLocationGroups(dayAttendances),
      };
    });
  }

  private buildOrderedLocationGroups(attendances: Attendance[]): AttendanceLocationGroup[] {
    const sorted = [...attendances].sort((a, b) => a.punch_time.localeCompare(b.punch_time));

    return sorted.reduce<AttendanceLocationGroup[]>((groups, attendance) => {
      const campus = this.campusName(attendance.campus);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup?.campus === campus) {
        lastGroup.attendances.push(attendance);
        return groups;
      }

      groups.push({campus, attendances: [attendance]});

      return groups;
    }, []);
  }
}
