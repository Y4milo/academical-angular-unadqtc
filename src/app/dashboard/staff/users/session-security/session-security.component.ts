import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { NotificationService } from '../../../../services/notification.service';
import { SessionSecurityService, SessionSecuritySettings, SessionSecurityValues } from '../../../../services/session-security.service';

/** Cada ajuste con su etiqueta, su unidad y lo que significa para quien lo cambia. */
export const SESSION_FIELDS: { key: keyof SessionSecurityValues; label: string; unit: string; hint: string }[] = [
  { key: 'idle_minutes', label: 'Inactividad', unit: 'minutos', hint: 'Sin ninguna petición durante este tiempo, la sesión se cierra.' },
  { key: 'max_hours', label: 'Duración máxima', unit: 'horas', hint: 'Una sesión se cierra al llegar a este tiempo, aunque la persona siga trabajando.' },
  { key: 'warning_seconds', label: 'Aviso previo', unit: 'segundos', hint: 'Cuánto antes de cerrarse se avisa a la persona.' },
];

/**
 * «Seguridad de sesión»: los tiempos con que se cierra sola una sesión de Academical, las abiertas con Core y las locales. Nunca deben ser más
 * largos que los de Core. Solo el administrador cambia esto (el API también lo exige).
 */
@Component({
  selector: 'app-session-security',
  imports: [FormsModule, ButtonModule, InputNumberModule, MessageModule, SkeletonModule, TagModule],
  templateUrl: './session-security.component.html',
  styleUrl: './session-security.component.css',
})
export class SessionSecurityComponent implements OnInit {
  private readonly service = inject(SessionSecurityService);
  private readonly notificationService = inject(NotificationService);

  readonly fields = SESSION_FIELDS;
  readonly saved = signal<SessionSecuritySettings | null>(null);
  readonly values = signal<SessionSecurityValues | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly saveError = signal('');

  readonly dirty = computed(() => {
    const saved = this.saved()?.values;
    const current = this.values();

    return !!saved && !!current && this.fields.some(field => saved[field.key] !== current[field.key]);
  });

  /** ¿Cada valor está dentro de su rango? Si no, no se puede guardar. */
  readonly valid = computed(() => {
    const limits = this.saved()?.limits;
    const current = this.values();

    return !!limits && !!current && this.fields.every(field => {
      const value = current[field.key];
      const [min, max] = limits[field.key];

      return typeof value === 'number' && value >= min && value <= max;
    });
  });

  /** Lo que significa hoy lo elegido, en palabras de quien lo cambia. */
  readonly effect = computed(() => {
    const current = this.values();
    if (!current) return '';

    return `Una sesión se cierra tras ${current.idle_minutes} minutos sin actividad, o a las ${current.max_hours} horas de abierta, lo que ocurra primero. Se avisa ${current.warning_seconds} segundos antes.`;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.service.settings().subscribe({
      next: response => {
        this.loading.set(false);
        if (response.status === STATUS.success) {
          this.apply(response.payload.data);
        } else {
          this.loadError.set(response.payload?.message || 'No se pudo consultar la configuración.');
        }
      },
      error: error => {
        this.loading.set(false);
        this.loadError.set(error?.status === 403 ? 'Solo el administrador del sistema puede cambiar esta configuración.' : 'No se pudo consultar la configuración. Inténtalo nuevamente.');
      },
    });
  }

  private apply(settings: SessionSecuritySettings): void {
    this.saved.set(settings);
    this.values.set({ idle_minutes: settings.values.idle_minutes, max_hours: settings.values.max_hours, warning_seconds: settings.values.warning_seconds });
  }

  change(key: keyof SessionSecurityValues, value: number | null): void {
    this.values.update(current => (current && value !== null ? { ...current, [key]: value } : current));
  }

  limits(key: keyof SessionSecurityValues): [number, number] {
    return this.saved()?.limits[key] ?? [0, 0];
  }

  /** Vuelve a los valores recomendados (sin guardar). */
  useDefaults(): void {
    const defaults = this.saved()?.defaults;
    if (defaults) this.values.set({ ...defaults });
  }

  reset(): void {
    const saved = this.saved()?.values;
    if (saved) this.values.set({ idle_minutes: saved.idle_minutes, max_hours: saved.max_hours, warning_seconds: saved.warning_seconds });
  }

  save(): void {
    const current = this.values();
    if (!current || !this.dirty() || !this.valid() || this.saving()) return;

    this.saving.set(true);
    this.saveError.set('');
    this.service.update(current).subscribe({
      next: response => {
        this.saving.set(false);
        if (response.status === STATUS.success) {
          this.apply(response.payload.data);
          this.notificationService.notifyApiData(response);
        } else {
          this.saveError.set(response.payload?.message || 'No se pudo guardar la configuración.');
        }
      },
      error: error => {
        this.saving.set(false);
        this.saveError.set(error?.error?.payload?.message || 'No se pudo guardar la configuración. Inténtalo nuevamente.');
      },
    });
  }
}
