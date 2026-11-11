import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrimeTemplate } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TimelineModule } from 'primeng/timeline';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { DirectiveSettings, DirectiveSettingsValues, DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { DirectiveLogDrawerComponent } from '../directive-tracking/directive-log-drawer.component';

type Option<T extends string> = { label: string; value: T };

/** Las tres reglas de visibilidad con su texto; la clave es la del servidor. */
export const SETTING_RULES: { key: keyof DirectiveSettingsValues; title: string; hint: string; options: Option<string>[] }[] = [
  {
    key: 'pending_docs',
    title: 'Documentos para oficinas a las que aún no les toca',
    hint: 'Por ejemplo, Presidencia mientras la directiva está en Asesoría Jurídica.',
    options: [{ label: 'Pueden ver los PDF', value: 'yes' }, { label: 'Solo el estado, sin PDF', value: 'no' }],
  },
  {
    key: 'signed_versions',
    title: 'Versiones para oficinas que ya firmaron',
    hint: 'Cuando la directiva se devuelve y hay una versión nueva.',
    options: [{ label: 'Solo la que firmaron', value: 'own' }, { label: 'Todas las versiones', value: 'all' }],
  },
  {
    key: 'reason_visibility',
    title: 'Motivo del rechazo',
    hint: 'Quién puede leer lo que escribió quien rechazó.',
    options: [{ label: 'Origen y quien rechazó', value: 'origin' }, { label: 'Toda la ruta', value: 'route' }],
  },
];

/** Los avisos por correo que el administrador puede apagar; todos vienen encendidos. */
export const NOTICE_RULES: { key: keyof DirectiveSettingsValues; title: string; hint: string }[] = [
  { key: 'notify_turn', title: 'Le toca firmar', hint: 'A la persona designada de la oficina a la que llega el turno.' },
  { key: 'notify_returned', title: 'Directiva devuelta', hint: 'A quien la envió, con el motivo.' },
  { key: 'notify_void', title: 'Firma sin efecto', hint: 'A las oficinas que ya habían firmado la versión devuelta, sin motivo.' },
  { key: 'notify_completed', title: 'Firmaron todas las oficinas', hint: 'A quien envió la directiva.' },
  { key: 'notify_cancelled', title: 'Directiva anulada', hint: 'A la persona con el turno y a las oficinas que ya firmaron; a quien la envió si otra persona la anuló.' },
];

const KEY_LABELS: Record<string, string> = {
  pending_docs: 'Documentos sin turno', signed_versions: 'Versiones de quien firmó', reason_visibility: 'Motivo del rechazo',
  notify_turn: 'Aviso: le toca firmar', notify_returned: 'Aviso: directiva devuelta', notify_void: 'Aviso: firma sin efecto', notify_completed: 'Aviso: firmaron todas', notify_cancelled: 'Aviso: directiva anulada',
};
const VALUE_LABELS: Record<string, string> = { yes: 'Pueden ver los PDF', no: 'Solo el estado', own: 'Solo la que firmaron', all: 'Todas las versiones', origin: 'Origen y quien rechazó', route: 'Toda la ruta' };

/**
 * Qué ve cada oficina de la ruta de firmas de una directiva: solo para el administrador. Las reglas aplican a todas las directivas, también a las
 * que están en curso, y cada cambio queda registrado con quién lo hizo y el valor anterior. A un lado se ve cómo lo vería una oficina a la que aún
 * no le toca firmar.
 */
@Component({
  selector: 'app-directive-settings',
  imports: [DatePipe, FormsModule, PrimeTemplate, ButtonModule, MessageModule, SelectButtonModule, SkeletonModule, TagModule, TimelineModule, ToggleSwitchModule, DirectiveLogDrawerComponent],
  templateUrl: './directive-settings.component.html',
  styleUrl: './directive-settings.component.css',
})
export class DirectiveSettingsComponent implements OnInit {
  readonly rules = SETTING_RULES;
  readonly notices = NOTICE_RULES;
  /** El cajón del registro de cambios (botón de la cabecera). */
  readonly historyOpen = signal(false);
  readonly saved = signal<DirectiveSettings | null>(null);
  readonly values = signal<DirectiveSettingsValues | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly saveError = signal('');

  readonly dirty = computed(() => {
    const saved = this.saved()?.values;
    const current = this.values();

    return !!saved && !!current && [...SETTING_RULES, ...NOTICE_RULES].some(rule => saved[rule.key] !== current[rule.key]);
  });
  readonly preview = computed(() => {
    const current = this.values();
    if (!current) return null;

    return {
      documents: current.pending_docs === 'yes',
      reason: current.reason_visibility === 'route',
    };
  });

  constructor(
    private service: DirectivesService,
    private notificationService: NotificationService,
  ) {}

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

  private apply(settings: DirectiveSettings): void {
    this.saved.set(settings);
    this.values.set({ ...settings.values });
  }

  toggleNotice(key: keyof DirectiveSettingsValues, on: boolean): void {
    this.choose(key, on ? 'yes' : 'no');
  }

  choose(key: keyof DirectiveSettingsValues, value: string | null): void {
    if (value === null) return;
    this.values.update(current => (current ? ({ ...current, [key]: value } as DirectiveSettingsValues) : current));
  }

  reset(): void {
    const defaults = this.saved()?.defaults;
    if (defaults) this.values.set({ ...defaults });
  }

  save(): void {
    const current = this.values();
    if (!current || !this.dirty() || this.saving()) return;

    this.saving.set(true);
    this.saveError.set('');
    this.service.updateSettings(current).subscribe({
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

  valueLabel(value: string | null, key?: string): string {
    if (value === null) return '—';
    if (key?.startsWith('notify_')) return value === 'yes' ? 'Encendido' : 'Apagado';

    return VALUE_LABELS[value] ?? value;
  }
}
