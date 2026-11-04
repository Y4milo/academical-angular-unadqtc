import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrimeTemplate } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { CoreIntegrationService, CoreIntegrationSettings, CoreIntegrationValues } from '../../../../services/core-integration.service';
import { NotificationService } from '../../../../services/notification.service';

const MODE_OPTIONS = [
  { label: 'Opcional: también con usuario y contraseña', value: 'optional' },
  { label: 'Obligatorio: solo con Core', value: 'required' },
];

const KEY_LABELS: Record<string, string> = { sso: 'Entrar con Core', mode: 'Modo de ingreso' };
const VALUE_LABELS: Record<string, string> = { on: 'Activado', off: 'Desactivado', optional: 'Opcional', required: 'Obligatorio' };

/**
 * La integración con Core que maneja el administrador: si se entra a Academical con la cuenta de Core y si ese ingreso es obligatorio (el ingreso
 * de Academical deja de aparecer y se manda a Core). Los secretos del cliente no se ven ni se cambian aquí: viven en el servidor. Si Core no
 * responde o la configuración se rompe, el ingreso de Academical vuelve a aparecer solo, para que nadie quede fuera.
 */
@Component({
  selector: 'app-core-integration',
  imports: [DatePipe, FormsModule, PrimeTemplate, ButtonModule, MessageModule, SelectButtonModule, SkeletonModule, TagModule, TimelineModule, ToggleSwitchModule],
  templateUrl: './core-integration.component.html',
  styleUrl: './core-integration.component.css',
})
export class CoreIntegrationComponent implements OnInit {
  private readonly service = inject(CoreIntegrationService);
  private readonly notificationService = inject(NotificationService);

  readonly modeOptions = MODE_OPTIONS;
  readonly saved = signal<CoreIntegrationSettings | null>(null);
  readonly values = signal<CoreIntegrationValues | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly saveError = signal('');

  readonly dirty = computed(() => {
    const saved = this.saved()?.values;
    const current = this.values();

    return !!saved && !!current && (saved.sso !== current.sso || saved.mode !== current.mode);
  });
  readonly checks = computed(() => Object.entries(this.saved()?.checks ?? {}).map(([key, check]) => ({ key, ...check })));
  /** Qué pasaría hoy con el ingreso, según lo elegido y lo que dicen las comprobaciones. */
  readonly effect = computed(() => {
    const current = this.values();
    if (!current || current.sso === 'off') return 'Se entra solo con usuario y contraseña de Academical.';
    if (current.mode === 'optional') return 'Quien llegue desde Core entra directo. En Academical sigue el ingreso con usuario y contraseña.';

    return 'El ingreso de Academical no aparece: todas las personas entran con su cuenta de Core. Si Core no responde, vuelve a aparecer mientras tanto.';
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

  private apply(settings: CoreIntegrationSettings): void {
    this.saved.set(settings);
    this.values.set({ ...settings.values });
  }

  toggleSso(on: boolean): void {
    this.values.update(current => (current ? { ...current, sso: on ? 'on' : 'off' } : current));
  }

  chooseMode(mode: string | null): void {
    if (mode === null) return;
    this.values.update(current => (current ? ({ ...current, mode } as CoreIntegrationValues) : current));
  }

  reset(): void {
    const saved = this.saved()?.values;
    if (saved) this.values.set({ ...saved });
  }

  save(): void {
    const current = this.values();
    if (!current || !this.dirty() || this.saving()) return;

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

  keyLabel(key: string): string {
    return KEY_LABELS[key] ?? key;
  }

  valueLabel(value: string | null): string {
    return value === null ? '—' : VALUE_LABELS[value] ?? value;
  }
}
