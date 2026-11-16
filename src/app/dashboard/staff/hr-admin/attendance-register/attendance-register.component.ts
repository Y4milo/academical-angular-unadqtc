import {Component, ElementRef, HostListener, OnInit, ViewChild, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {TextareaModule} from 'primeng/textarea';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {TableModule} from 'primeng/table';
import {SelectButtonModule} from 'primeng/selectbutton';
import {DialogModule} from 'primeng/dialog';
import {MessageModule} from 'primeng/message';
import {SkeletonModule} from 'primeng/skeleton';
import {
  AttendanceService,
  DayRole,
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
const ROLE_KEY = 'attendance-register.day-role';
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
  imports: [FormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, TagModule, TableModule, MessageModule, SkeletonModule, SelectButtonModule, DialogModule],
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
  dayRole: DayRole = 'entry';
  readonly dayRoles: {value: DayRole; label: string; icon: string; tone: string}[] = [
    {value: 'entry', label: 'Entrada', icon: 'pi pi-sign-in', tone: 'entry'},
    {value: 'lunch_out', label: 'Salida a almuerzo', icon: 'pi pi-clock', tone: 'lunch'},
    {value: 'lunch_in', label: 'Regreso de almuerzo', icon: 'pi pi-replay', tone: 'lunch'},
    {value: 'exit', label: 'Salida', icon: 'pi pi-sign-out', tone: 'exit'},
  ];
  /** Una marcación repetida espera la decisión de quien registra: se registra de todos modos o se descarta. */
  duplicateVisible = false;

  sending = false;
  loadingToday = true;
  result: ManualAttendanceResult | null = null;
  /** Aviso del backend que no es un error técnico: DNI que no es personal, de baja, Core caído... */
  notice: { title: string; message: string; reason: string } | null = null;
  today: ManualAttendanceRow[] = [];

  private keyTimes: number[] = [];
  private reasonDigitTimes: number[] = [];

  get reasonValid(): boolean {
    return this.reason.trim().length >= 10;
  }

  get ready(): boolean {
    return this.campusId !== null && this.reasonValid;
  }

  ngOnInit(): void {
    this.reason = this.read(REASON_KEY) ?? '';
    const savedRole = this.read(ROLE_KEY);
    this.dayRole = this.dayRoles.some((r) => r.value === savedRole) ? (savedRole as DayRole) : 'entry';
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

  onDayRoleChange(): void {
    this.write(ROLE_KEY, this.dayRole);
    this.focusDni();
  }

  onReasonChange(): void {
    this.write(REASON_KEY, this.reason);
  }

  /**
   * Enter en el motivo pasa al campo del DNI. Si el cursor se quedó en el motivo y llegan dígitos a ráfaga (lo que hace el lector), esos
   * dígitos se sacan del motivo y se mueven al campo del DNI, para que la primera lectura no se pierda ahí.
   */
  onReasonKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.focusDniNow();
      return;
    }

    if (!/^\d$/.test(event.key) || event.ctrlKey || event.metaKey || event.altKey) {
      if (event.key.length === 1) {
        this.reasonDigitTimes = [];
      }
      return;
    }

    const now = performance.now();
    this.reasonDigitTimes = [...this.reasonDigitTimes, now].slice(-3);

    if (this.reasonDigitTimes.length < 3 || now - this.reasonDigitTimes[0] > SCANNER_MAX_MS_PER_KEY * 2) {
      return;
    }

    const typed = this.reason.match(/\d{0,2}$/)?.[0] ?? '';
    this.reason = this.reason.slice(0, this.reason.length - typed.length);
    this.onReasonChange();
    this.dni = (typed + event.key).slice(0, DNI_LENGTH);
    this.keyTimes = [...this.reasonDigitTimes];
    this.reasonDigitTimes = [];
    event.preventDefault();
    this.focusDniNow();
  }

  /** Al salir del motivo sin ir a otro campo (clic en la página), el cursor pasa al DNI para el siguiente escaneo. */
  onReasonBlur(event: FocusEvent): void {
    if (event.relatedTarget === null && this.ready) {
      this.focusDni();
    }
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

    // Sin sede o motivo, el aviso fijo bajo el campo ya explica qué falta.
    if (!this.ready) {
      return;
    }

    if (this.dni.length !== DNI_LENGTH) {
      this.notice = {title: 'DNI no válido', message: 'El DNI debe tener exactamente 8 dígitos.', reason: 'invalid_dni'};
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
      day_role: this.dayRole,
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
        // Un duplicado espera la decisión en un modal: se conserva el DNI. Cualquier otro aviso deja listo el campo para la siguiente persona.
        if (this.notice.reason === 'duplicate') {
          this.duplicateVisible = true;
        } else {
          this.resetDni();
        }
      },
      error: () => {
        this.sending = false;
        this.notifications.error('Error', 'Ocurrió un problema al registrar la asistencia.');
        this.focusDni();
      },
    });
  }

  confirmDuplicate(): void {
    this.duplicateVisible = false;
    this.submit(true);
  }

  /** «No registrar»: se descarta la lectura y el campo queda listo para la siguiente persona. */
  discardDuplicate(): void {
    this.duplicateVisible = false;
    this.notice = null;
    this.resetDni();
  }

  roleLabel(role: DayRole | null | undefined): string | null {
    return this.dayRoles.find((r) => r.value === role)?.label ?? null;
  }

  roleTone(role: DayRole | null | undefined): Severity {
    return role === 'entry' ? 'success' : role === 'exit' ? 'info' : role ? 'warn' : 'info';
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

  /**
   * El campo no se deshabilita mientras se envía (un campo deshabilitado pierde el foco y el lector ya no puede escribir): queda de
   * solo lectura. Se reenfoca dos veces porque la pantalla puede volver a dibujarse justo después de la respuesta.
   */
  private focusDniNow(): void {
    this.dniInput?.nativeElement.focus({preventScroll: true});
  }

  private focusDni(): void {
    const focus = () => this.dniInput?.nativeElement.focus({preventScroll: true});

    setTimeout(focus, 0);
    setTimeout(() => {
      if (document.activeElement !== this.dniInput?.nativeElement) {
        focus();
      }
    }, 150);
  }

  /** Si el foco quedó fuera de un campo (se hizo clic en la página) y el lector escribe un dígito, el dígito va al campo del DNI. */
  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    const active = document.activeElement;
    const typing = active instanceof HTMLElement && (active.matches('input, textarea, select, [contenteditable="true"]') || active.closest('[role="dialog"]'));

    if (typing || event.ctrlKey || event.metaKey || event.altKey || !/^\d$/.test(event.key) || this.sending) {
      return;
    }

    event.preventDefault();
    this.dni = (this.dni + event.key).slice(0, DNI_LENGTH);
    this.keyTimes.push(performance.now());
    this.focusDni();
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
