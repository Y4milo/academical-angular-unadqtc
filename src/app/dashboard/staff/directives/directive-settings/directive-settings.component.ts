import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TimelineModule } from 'primeng/timeline';
import { ToolbarModule } from 'primeng/toolbar';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { DirectiveSettings, DirectiveSettingsValues, DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { DirectiveLogDrawerComponent } from '../directive-tracking/directive-log-drawer.component';

type Option<T extends string> = { label: string; value: T };

/** Las tres reglas de visibilidad con su texto; la clave es la del servidor. */
export const SETTING_RULES: { key: keyof DirectiveSettingsValues; title: string; hint: string; options: Option<string>[] }[] = [
  {
    key: 'pending_docs',
    title: 'Oficinas que aún no les toca',
    hint: 'Por ejemplo, Presidencia mientras el documento está en Asesoría Jurídica.',
    options: [{ label: 'Pueden ver los PDF', value: 'yes' }, { label: 'Solo el estado, sin PDF', value: 'no' }],
  },
  {
    key: 'signed_versions',
    title: 'Versiones para oficinas que ya firmaron',
    hint: 'Cuando el documento se devuelve y hay una versión nueva.',
    options: [{ label: 'Solo la que firmaron', value: 'own' }, { label: 'Todas las versiones', value: 'all' }],
  },
  {
    key: 'reason_visibility',
    title: 'Motivo de la devolución',
    hint: 'Quién puede leer lo que escribió quien devolvió.',
    options: [{ label: 'Origen y quien devolvió', value: 'origin' }, { label: 'Toda la ruta', value: 'route' }],
  },
];

/** Los avisos por correo que el administrador puede apagar; todos vienen encendidos. */
export const NOTICE_RULES: { key: keyof DirectiveSettingsValues; title: string; hint: string }[] = [
  { key: 'notify_turn', title: 'Le toca firmar', hint: 'A la persona designada de la oficina a la que llega el turno.' },
  { key: 'notify_returned', title: 'Documento devuelto', hint: 'A quien lo envió, con el motivo.' },
  { key: 'notify_void', title: 'Firma sin efecto', hint: 'A las oficinas que ya habían firmado la versión devuelta, sin motivo.' },
  { key: 'notify_completed', title: 'Documento firmado por todas', hint: 'A quien lo envió, con el código de verificación.' },
  { key: 'notify_cancelled', title: 'Documento anulado', hint: 'A la persona con el turno y a las oficinas que ya firmaron; a quien lo envió si otra persona lo anuló.' },
];

const KEY_LABELS: Record<string, string> = {
  pending_docs: 'Documentos sin turno', signed_versions: 'Versiones de quien firmó', reason_visibility: 'Motivo de la devolución',
  notify_turn: 'Aviso: le toca firmar', notify_returned: 'Aviso: documento devuelto', notify_void: 'Aviso: firma sin efecto', notify_completed: 'Aviso: firmaron todas', notify_cancelled: 'Aviso: documento anulado',
};
const VALUE_LABELS: Record<string, string> = { yes: 'Pueden ver los PDF', no: 'Solo el estado', own: 'Solo la que firmaron', all: 'Todas las versiones', origin: 'Origen y quien devolvió', route: 'Toda la ruta' };

/**
 * Qué ve cada oficina de la ruta de firmas de una directiva: solo para el administrador. Las reglas aplican a todas las directivas, también a las
 * que están en curso, y cada cambio queda registrado con quién lo hizo y el valor anterior. A un lado se ve cómo lo vería una oficina a la que aún
 * no le toca firmar.
 */
@Component({
  selector: 'app-directive-settings',
  imports: [DatePipe, FormsModule, PrimeTemplate, BreadcrumbModule, ButtonModule, CardModule, ToolbarModule, MessageModule, SelectButtonModule, SkeletonModule, TagModule, TimelineModule, ToggleSwitchModule, DirectiveLogDrawerComponent],
  templateUrl: './directive-settings.component.html',
  styleUrl: './directive-settings.component.css',
})
export class DirectiveSettingsComponent implements OnInit {
  /** Las migas: la lista de documentos y esta pantalla. */
  readonly crumbs: MenuItem[] = [{ label: 'Documentos de gestión', command: () => this.router.navigateByUrl(PATHS.directives.link) }, { label: 'Visibilidad de documentos' }];
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
    private router: Router,
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

  /** Descarta lo elegido y vuelve a lo último que se guardó. */
  discard(): void {
    const saved = this.saved();
    if (saved) this.values.set({ ...saved.values });
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
