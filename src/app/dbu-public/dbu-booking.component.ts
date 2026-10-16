import { Component, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputOtpModule } from 'primeng/inputotp';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { Select } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { StepsModule } from 'primeng/steps';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { TestModeBannerComponent } from '../core/components/test-mode-banner.component';
import {
  DbuPublicAppointment, DbuPublicAvailability, DbuPublicConfig, DbuPublicDay, DbuPublicService, dbuErrorMessage,
} from './dbu-public.service';
import { TurnstileWidgetComponent } from './turnstile-widget';

type Step = 'identity' | 'email' | 'code' | 'choose' | 'done';

const STEP_INDEX: Record<Step, number> = { identity: 0, email: 1, code: 2, choose: 3, done: 4 };

interface Option { label: string; value: string; disabled?: boolean }

/** Reserva pública de una cita con Bienestar Universitario: documento, correo, código, día y hora. Sin cuenta. */
@Component({
  selector: 'app-dbu-booking',
  standalone: true,
  imports: [
    FormsModule, RouterLink, ButtonModule, CardModule, InputOtpModule, InputTextModule, MessageModule, Select, SelectButtonModule,
    SkeletonModule, StepsModule, TextareaModule, TestModeBannerComponent, TurnstileWidgetComponent,
  ],
  templateUrl: './dbu-booking.component.html',
  styleUrl: './dbu-booking.component.css',
})
export class DbuBookingComponent implements OnInit, OnDestroy {
  @ViewChild(TurnstileWidgetComponent) turnstile?: TurnstileWidgetComponent;

  readonly steps: MenuItem[] = [{ label: 'Tus datos' }, { label: 'Correo' }, { label: 'Código' }, { label: 'Cita' }, { label: 'Listo' }];
  readonly documentTypes: Option[] = [
    { label: 'DNI', value: 'dni' },
    { label: 'Carné de extranjería', value: 'foreign_card' },
    { label: 'Pasaporte', value: 'passport' },
  ];

  readonly config = signal<DbuPublicConfig | null>(null);
  readonly configError = signal(false);
  readonly step = signal<Step>('identity');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly activeIndex = computed(() => STEP_INDEX[this.step()]);

  documentType = 'dni';
  documentNumber = '';
  readonly turnstileToken = signal<string | null>(null);
  readonly turnstileFailed = signal(false);

  private session = '';
  readonly studentName = signal('');

  email = '';
  phone = '';
  readonly sentTo = signal('');
  readonly resendIn = signal(0);
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  code = '';

  typeId: number | null = null;
  readonly availability = signal<DbuPublicAvailability | null>(null);
  readonly loadingAvailability = signal(false);
  readonly selectedDate = signal<string | null>(null);
  selectedTime: string | null = null;
  reason = '';

  readonly appointment = signal<DbuPublicAppointment | null>(null);

  /** Días con al menos un cupo libre, ya con su texto: se calcula una vez por disponibilidad, no en cada revisión. */
  readonly dayOptions = computed<Option[]>(() =>
    (this.availability()?.days ?? [])
      .filter(day => day.free_total > 0)
      .map(day => ({ value: day.date, label: this.dayLabel(day) })),
  );

  readonly timeOptions = computed<Option[]>(() => {
    const day = this.availability()?.days.find(item => item.date === this.selectedDate());
    return (day?.slots ?? []).map(slot => ({ value: slot.time, label: slot.time, disabled: !slot.available }));
  });

  readonly typeOptions = computed(() => this.config()?.types ?? []);

  ngOnInit(): void {
    this.service.configuration().subscribe({
      next: response => {
        this.config.set(response.payload.data);
        if (response.payload.data.types.length === 1) {
          this.typeId = response.payload.data.types[0].id;
        }
      },
      error: () => this.configError.set(true),
    });
  }

  ngOnDestroy(): void {
    this.stopResendTimer();
  }

  constructor(private service: DbuPublicService) {}

  get needsChallenge(): boolean {
    return this.config()?.turnstile.enabled === true;
  }

  canSubmitIdentity(): boolean {
    return !this.busy() && this.documentNumber.trim().length >= 6 && (!this.needsChallenge || !!this.turnstileToken());
  }

  submitIdentity(): void {
    if (!this.canSubmitIdentity()) {
      return;
    }
    this.start();
    this.service.identity({ document_type: this.documentType, document_number: this.documentNumber.trim(), turnstile_token: this.turnstileToken() })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: response => {
          this.session = response.payload.data.session;
          this.studentName.set(response.payload.data.name);
          this.turnstile?.reset();
          this.step.set('email');
        },
        error: error => {
          this.error.set(dbuErrorMessage(error));
          this.turnstile?.reset();
        },
      });
  }

  canSendCode(): boolean {
    return !this.busy() && /^\S+@\S+\.\S+$/.test(this.email.trim()) && (!this.needsChallenge || !!this.turnstileToken());
  }

  sendCode(): void {
    if (!this.canSendCode()) {
      return;
    }
    this.start();
    this.service.sendCode({ session: this.session, email: this.email.trim(), phone: this.phone.trim() || null, turnstile_token: this.turnstileToken() })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: response => {
          this.sentTo.set(response.payload.data.sent_to);
          this.code = '';
          this.startResendTimer();
          this.turnstile?.reset();
          this.step.set('code');
        },
        error: error => {
          this.error.set(dbuErrorMessage(error));
          this.turnstile?.reset();
        },
      });
  }

  verifyCode(): void {
    if (this.busy() || this.code.length !== 6) {
      return;
    }
    this.start();
    this.service.verifyCode({ session: this.session, code: this.code })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.step.set('choose');
          if (this.typeId !== null) {
            this.loadAvailability();
          }
        },
        error: error => this.error.set(dbuErrorMessage(error)),
      });
  }

  changeEmail(): void {
    this.error.set('');
    this.step.set('email');
  }

  loadAvailability(keepError = false): void {
    if (this.typeId === null) {
      return;
    }
    this.loadingAvailability.set(true);
    this.availability.set(null);
    this.selectedDate.set(null);
    this.selectedTime = null;
    if (!keepError) {
      this.error.set('');
    }
    this.service.availability({ session: this.session, type_id: this.typeId })
      .pipe(finalize(() => this.loadingAvailability.set(false)))
      .subscribe({
        next: response => this.availability.set(response.payload.data),
        error: error => this.error.set(dbuErrorMessage(error)),
      });
  }

  chooseDate(date: string | null): void {
    this.selectedDate.set(date);
    this.selectedTime = null;
  }

  canReserve(): boolean {
    return !this.busy() && this.typeId !== null && !!this.selectedDate() && !!this.selectedTime;
  }

  reserve(): void {
    if (!this.canReserve()) {
      return;
    }
    this.start();
    this.service.reserve({ session: this.session, type_id: this.typeId as number, date: this.selectedDate() as string, time: this.selectedTime as string, reason: this.reason.trim() || null })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: response => {
          this.appointment.set(response.payload.data);
          this.step.set('done');
        },
        error: error => {
          this.error.set(dbuErrorMessage(error));
          // Otro alumno pudo tomar el cupo: se muestra lo que queda libre.
          this.loadAvailability(true);
        },
      });
  }

  prettyDate(date: string): string {
    return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(this.toLocal(date));
  }

  private dayLabel(day: DbuPublicDay): string {
    const date = new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric', month: 'short' }).format(this.toLocal(day.date));
    return `${date} · ${day.free_total} ${day.free_total === 1 ? 'cupo' : 'cupos'}`;
  }

  private toLocal(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private start(): void {
    this.busy.set(true);
    this.error.set('');
  }

  private startResendTimer(): void {
    this.stopResendTimer();
    this.resendIn.set(60);
    this.resendTimer = setInterval(() => {
      this.resendIn.update(value => Math.max(0, value - 1));
      if (this.resendIn() === 0) {
        this.stopResendTimer();
      }
    }, 1000);
  }

  private stopResendTimer(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
