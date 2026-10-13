import {Component, ElementRef, OnInit, ViewChild, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {TextareaModule} from 'primeng/textarea';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {TableModule} from 'primeng/table';
import {MessageModule} from 'primeng/message';
import {
  AttendanceService,
  ManualAttendanceResult,
  ManualAttendanceRow,
  ManualAttendanceSource,
} from '../../../../services/attendance.service';
import {DictionaryService} from '../../../../services/dictionary.service';
import {NotificationService} from '../../../../services/notification.service';
import {Dictionary} from '../../../../models/dictionary.model';
import {STATUS} from '../../../../core/constants/api-status.constants';

type Severity = 'success' | 'warn' | 'danger' | 'info';

const CAMPUS_KEY = 'attendance-register.campus';
const REASON_KEY = 'attendance-register.reason';
const DNI_LENGTH = 8;
/** Un lector de barras escribe los 8 dígitos en una ráfaga: por debajo de este promedio entre teclas no es una persona escribiendo. */
const SCANNER_MAX_MS_PER_KEY = 35;

/**
 * Registro de asistencia por DNI con lector de barras (código 1D) o teclado. Es para casos especiales: solo admin y RRHH,
 * con motivo obligatorio. Core decide si el DNI es de personal; el backend dice qué marcación fue según el horario.
 */
@Component({
  selector: 'app-attendance-register',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, TagModule, TableModule, MessageModule],
  templateUrl: './attendance-register.component.html',
  styleUrl: './attendance-register.component.css',
})
export class AttendanceRegisterComponent implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly dictionaryService = inject(DictionaryService);
  private readonly notifications = inject(NotificationService);

  @ViewChild('dniInput') private dniInput?: ElementRef<HTMLInputElement>;

  campuses: Dictionary[] = [];
  campusId: number | null = null;
  reason = '';
  dni = '';

  sending = false;
  loadingToday = true;
  result: ManualAttendanceResult | null = null;
  /** Aviso del backend que no es un error técnico: DNI que no es personal, de baja, Core caído... */
  notice: { title: string; message: string; reason: string } | null = null;
  today: ManualAttendanceRow[] = [];

  private keyTimes: number[] = [];

  get reasonValid(): boolean {
    return this.reason.trim().length >= 10;
  }

  get ready(): boolean {
    return this.campusId !== null && this.reasonValid;
  }

  ngOnInit(): void {
    this.reason = this.read(REASON_KEY) ?? '';
    const saved = Number(this.read(CAMPUS_KEY));

    this.dictionaryService.getCampusList().subscribe({
      next: (res) => {
        this.campuses = res.payload?.data ?? [];
        this.campusId = this.campuses.some((c) => c.id === saved) ? saved : null;
        this.loadToday();
        this.focusDni();
      },
      error: () => {
        this.loadingToday = false;
        this.notifications.error('Error', 'No se pudieron cargar las sedes.');
      },
    });
  }

  onCampusChange(): void {
    this.write(CAMPUS_KEY, String(this.campusId ?? ''));
    this.loadToday();
    this.focusDni();
  }

  onReasonChange(): void {
    this.write(REASON_KEY, this.reason);
  }

  onDniInput(): void {
    this.dni = this.dni.replace(/\D/g, '').slice(0, DNI_LENGTH);
  }

  onDniKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submit();
      return;
    }

    if (/^\d$/.test(event.key)) {
      this.keyTimes.push(performance.now());
    }
  }

  submit(confirmDuplicate = false): void {
    if (this.sending) {
      return;
    }

    if (!this.ready) {
      this.notifications.warning('Falta información', 'Seleccione la sede y escriba el motivo antes de registrar.');
      return;
    }

    if (this.dni.length !== DNI_LENGTH) {
      this.notifications.warning('DNI no válido', 'El DNI debe tener exactamente 8 dígitos.');
      this.focusDni();
      return;
    }

    const dni = this.dni;
    this.sending = true;
    this.notice = null;

    this.attendanceService.registerByDni({
      dni,
      reason: this.reason.trim(),
      campus_id: this.campusId!,
      source: this.detectSource(),
      confirm_duplicate: confirmDuplicate,
    }).subscribe({
      next: (res) => {
        this.sending = false;

        if (res.status === STATUS.success) {
          this.result = res.payload.data;
          this.resetDni();
          this.loadToday();
          return;
        }

        const payload = res.payload as unknown as { title?: string; message?: string; reason?: string };
        this.result = null;
        this.notice = {
          title: payload.title ?? 'No se registró la asistencia',
          message: payload.message ?? 'Intente de nuevo.',
          reason: payload.reason ?? 'unknown',
        };
        // Un duplicado espera confirmación: se conserva el DNI. Cualquier otro aviso deja listo el campo para la siguiente persona.
        if (this.notice.reason !== 'duplicate') {
          this.resetDni();
        } else {
          this.focusDni();
        }
      },
      error: () => {
        this.sending = false;
        this.notifications.error('Error', 'Ocurrió un problema al registrar la asistencia.');
        this.focusDni();
      },
    });
  }

  severity(status: string | null | undefined): Severity {
    switch (status) {
      case 'on_time':
        return 'success';
      case 'late':
      case 'early_exit':
      case 'non_working_day':
      case 'no_schedule':
      case 'after_hours':
        return 'warn';
      case 'beyond_tolerance':
        return 'danger';
      default:
        return 'info';
    }
  }

  kindLabel(kind: string | null | undefined): string {
    return kind === 'entry' ? 'Entrada' : kind === 'exit' ? 'Salida' : 'Fuera de horario';
  }

  sourceLabel(source: ManualAttendanceSource): string {
    return source === 'barcode' ? 'Lector' : 'Teclado';
  }

  private detectSource(): ManualAttendanceSource {
    const times = this.keyTimes.slice(-DNI_LENGTH);
    if (times.length === DNI_LENGTH) {
      const averageMs = (times[times.length - 1] - times[0]) / (DNI_LENGTH - 1);
      if (averageMs <= SCANNER_MAX_MS_PER_KEY) {
        return 'barcode';
      }
    }
    return 'keyboard';
  }

  private resetDni(): void {
    this.dni = '';
    this.keyTimes = [];
    this.focusDni();
  }

  private loadToday(): void {
    this.loadingToday = true;
    this.attendanceService.manualToday(this.campusId ?? undefined).subscribe({
      next: (res) => {
        this.today = res.status === STATUS.success ? res.payload.data : [];
        this.loadingToday = false;
      },
      error: () => {
        this.loadingToday = false;
      },
    });
  }

  private focusDni(): void {
    setTimeout(() => this.dniInput?.nativeElement.focus(), 0);
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* sin almacenamiento: la pantalla funciona igual, solo no recuerda el valor */
    }
  }
}
