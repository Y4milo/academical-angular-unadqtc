import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ListboxModule } from 'primeng/listbox';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { ApiData } from '../../../../models/api/api-data.model';
import {
  DbuAppointmentType, DbuAttendant, DbuCandidate, DbuConfig, DbuConfigLog, DbuConfigService, DbuSettings, DbuWeekday,
} from '../../../../services/dbu-config.service';
import { NotificationService } from '../../../../services/notification.service';

type Section = 'schedule' | 'booking' | 'waitlist' | 'attendance' | 'attendants' | 'types' | 'history';

const WEEKDAY_OPTIONS: { label: string; value: DbuWeekday }[] = [
  { label: 'Lun', value: 'mon' }, { label: 'Mar', value: 'tue' }, { label: 'Mié', value: 'wed' },
  { label: 'Jue', value: 'thu' }, { label: 'Vie', value: 'fri' }, { label: 'Sáb', value: 'sat' },
];

const ACTION_LABELS: Record<string, string> = {
  settings_updated: 'Ajustes cambiados',
  type_created: 'Tipo de atención creado',
  type_updated: 'Tipo de atención modificado',
  attendant_created: 'Encargado agregado',
  attendant_updated: 'Encargado modificado',
};

/** Configuración del módulo de citas de Bienestar Universitario. Administrador del sistema y administrador de DBU. */
@Component({
  selector: 'app-dbu-config',
  imports: [
    FormsModule, AppLucideIconComponent, ButtonModule, DatePickerModule, DialogModule, InputNumberModule, InputTextModule,
    ListboxModule, MessageModule, MultiSelectModule, SelectModule, SelectButtonModule, SkeletonModule, TableModule, TagModule,
    ToggleSwitchModule,
  ],
  templateUrl: './dbu-config.component.html',
  styleUrl: './dbu-config.component.css',
})
export class DbuConfigComponent implements OnInit {
  readonly weekdayOptions = WEEKDAY_OPTIONS;
  readonly sections: { label: string; value: Section }[] = [
    { label: 'Horario y días', value: 'schedule' },
    { label: 'Reservas', value: 'booking' },
    { label: 'Lista de espera', value: 'waitlist' },
    { label: 'Asistencia', value: 'attendance' },
    { label: 'Encargados', value: 'attendants' },
    { label: 'Tipos de atención', value: 'types' },
    { label: 'Historial de cambios', value: 'history' },
  ];

  readonly config = signal<DbuConfig | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly section = signal<Section>('schedule');
  readonly logs = signal<DbuConfigLog[] | null>(null);
  readonly selectedTypeId = signal<number | null>(null);

  /** Copia de trabajo de los ajustes: se compara con la guardada para saber si hay cambios. */
  form: DbuSettings | null = null;

  readonly weekdayLabels = Object.fromEntries(WEEKDAY_OPTIONS.map(option => [option.value, option.label])) as Record<DbuWeekday, string>;

  readonly capacity = computed(() => {
    const config = this.config();
    const typeId = this.selectedTypeId() ?? config?.types[0]?.id ?? null;
    return config && typeId !== null ? config.capacity[String(typeId)] ?? null : null;
  });

  attendantDialog = false;
  attendantEditing: DbuAttendant | null = null;
  attendantForm: { user_id: number | null; weekdays: DbuWeekday[]; start: Date | null; end: Date | null; type_ids: number[]; is_active: boolean } = this.emptyAttendant();
  attendantError = '';

  typeDialog = false;
  typeForm = { code: '', name: '' };
  typeError = '';

  constructor(
    private service: DbuConfigService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.config().subscribe({
      next: response => {
        this.loading.set(false);
        if (response.status === STATUS.success) {
          this.apply(response.payload.data);
        } else {
          this.loadError.set(true);
          this.notificationService.notifyApiData(response);
        }
      },
      error: error => {
        this.loading.set(false);
        this.loadError.set(true);
        this.notificationService.notifyApiData(error);
      },
    });
  }

  selectSection(value: Section | null): void {
    if (!value) {
      return;
    }
    this.section.set(value);
    if (value === 'history' && this.logs() === null) {
      this.service.logs().subscribe({
        next: response => this.logs.set(response.status === STATUS.success ? response.payload.data : []),
        error: () => this.logs.set([]),
      });
    }
  }

  get dirty(): boolean {
    const config = this.config();
    return !!this.form && !!config && JSON.stringify(this.form) !== JSON.stringify(config.settings);
  }

  discard(): void {
    const config = this.config();
    if (config) {
      this.form = { ...config.settings, weekdays: [...config.settings.weekdays] };
    }
  }

  saveSettings(): void {
    if (!this.form || !this.dirty) {
      return;
    }
    this.run(this.service.updateSettings(this.form));
  }

  // Horas HH:MM <-> Date para el selector de hora de PrimeNG.
  toDate(time: string | undefined): Date | null {
    if (!time) {
      return null;
    }
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  fromDate(date: Date | null): string {
    return date ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : '';
  }

  setTime(key: 'day_start' | 'day_end' | 'open_time', date: Date | null): void {
    if (this.form && date) {
      this.form[key] = this.fromDate(date);
    }
  }

  // Encargados
  openAddAttendant(): void {
    this.attendantEditing = null;
    this.attendantForm = this.emptyAttendant();
    this.attendantError = '';
    this.attendantDialog = true;
  }

  openEditAttendant(attendant: DbuAttendant): void {
    this.attendantEditing = attendant;
    this.attendantForm = {
      user_id: attendant.user_id,
      weekdays: [...attendant.weekdays],
      start: this.toDate(attendant.start_time),
      end: this.toDate(attendant.end_time),
      type_ids: [...attendant.type_ids],
      is_active: attendant.is_active,
    };
    this.attendantError = '';
    this.attendantDialog = true;
  }

  saveAttendant(): void {
    const form = this.attendantForm;
    this.attendantError = '';

    if (!this.attendantEditing && !form.user_id) {
      this.attendantError = 'Elige a la persona.';
      return;
    }
    if (!form.weekdays.length || !form.start || !form.end || !form.type_ids.length) {
      this.attendantError = 'Indica los días, el horario y al menos un tipo de atención.';
      return;
    }
    if (this.fromDate(form.end) <= this.fromDate(form.start)) {
      this.attendantError = 'La hora de salida debe ser posterior a la de entrada.';
      return;
    }

    const body = {
      weekdays: form.weekdays,
      start_time: this.fromDate(form.start),
      end_time: this.fromDate(form.end),
      type_ids: form.type_ids,
      is_active: form.is_active,
    };

    const call = this.attendantEditing
      ? this.service.updateAttendant(this.attendantEditing.id, body)
      : this.service.addAttendant({ ...body, user_id: form.user_id as number });

    this.run(call, () => (this.attendantDialog = false), message => (this.attendantError = message));
  }

  toggleAttendant(attendant: DbuAttendant, active: boolean): void {
    this.run(this.service.updateAttendant(attendant.id, { is_active: active }));
  }

  typeNames(ids: number[]): string {
    const types = this.config()?.types ?? [];
    return ids.map(id => types.find(type => type.id === id)?.name).filter(Boolean).join(', ');
  }

  // Tipos de atención
  openAddType(): void {
    this.typeForm = { code: '', name: '' };
    this.typeError = '';
    this.typeDialog = true;
  }

  saveType(): void {
    const name = this.typeForm.name.trim();
    const code = this.typeForm.code.trim();
    this.typeError = '';

    if (!name) {
      this.typeError = 'Escribe el nombre.';
      return;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(code)) {
      this.typeError = 'El código usa minúsculas, números y guion bajo, y empieza con una letra.';
      return;
    }

    this.run(this.service.addType({ code, name }), () => (this.typeDialog = false), message => (this.typeError = message));
  }

  toggleType(type: DbuAppointmentType, active: boolean): void {
    this.run(this.service.updateType(type.id, { is_active: active }));
  }

  actionLabel(action: string): string {
    return ACTION_LABELS[action] ?? action;
  }

  candidateOptions(): DbuCandidate[] {
    return this.config()?.candidates ?? [];
  }

  private emptyAttendant() {
    return { user_id: null as number | null, weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'] as DbuWeekday[], start: this.toDate('08:00'), end: this.toDate('15:00'), type_ids: [] as number[], is_active: true };
  }

  private apply(config: DbuConfig): void {
    this.config.set(config);
    this.form = { ...config.settings, weekdays: [...config.settings.weekdays] };
    this.logs.set(null);
    if (this.selectedTypeId() === null || !config.types.some(type => type.id === this.selectedTypeId())) {
      this.selectedTypeId.set(config.types[0]?.id ?? null);
    }
  }

  private run(call: Observable<ApiData<DbuConfig>>, onDone?: () => void, onError?: (message: string) => void): void {
    this.saving.set(true);
    call.subscribe({
      next: response => {
        this.saving.set(false);
        if (response.status === STATUS.success) {
          this.apply(response.payload.data);
          onDone?.();
        } else if (onError) {
          onError((response.payload as unknown as { message?: string })?.message ?? 'No se pudo guardar.');
        }
        this.notificationService.notifyApiData(response);
      },
      error: error => {
        this.saving.set(false);
        onError?.('No se pudo guardar. Revisa los datos e inténtalo nuevamente.');
        this.notificationService.notifyApiData(error);
      },
    });
  }
}
