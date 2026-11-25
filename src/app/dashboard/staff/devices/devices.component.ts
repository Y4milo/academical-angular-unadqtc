import {DatePipe} from '@angular/common';
import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ConfirmationService} from 'primeng/api';
import {ButtonModule} from 'primeng/button';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {MessageModule} from 'primeng/message';
import {SkeletonModule} from 'primeng/skeleton';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {finalize, Observable} from 'rxjs';
import {BrandIconComponent} from '../../../core/components/brand-icon/brand-icon.component';
import {AppLucideIconComponent} from '../../../core/components/lucide-icon/lucide-icon.component';
import {ApiData} from '../../../models/api/api-data.model';
import {BrowserSession, DevicesService} from '../../../services/devices.service';
import {browserIcon, deviceIcon, deviceSummary, deviceTitle, platformIcon} from './device-display';

/** The message the API sent with an error, or the one given. */
function errorMessage(response: unknown, fallback: string): string {
  const message = (response as {error?: {payload?: {message?: unknown}}} | null)?.error?.payload?.message;

  return typeof message === 'string' && message ? message : fallback;
}

/**
 * «Dispositivos y sesiones», the same screen as Core: the browsers where the person has Academical open. Closing one ends that session (that
 * browser goes back to the login); the one in use is not closed here (that is «Cerrar sesión»). With a session that came from Core, closing here
 * only closes Academical, so the screen points to Core's own «Dispositivos» to close Core too.
 */
@Component({
  selector: 'app-devices',
  imports: [DatePipe, BrandIconComponent, AppLucideIconComponent, ButtonModule, ConfirmPopupModule, MessageModule, SkeletonModule, TableModule, TagModule],
  providers: [ConfirmationService],
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.css',
})
export class DevicesComponent implements OnInit {
  private readonly service = inject(DevicesService);
  private readonly confirmation = inject(ConfirmationService);

  readonly sessions = signal<BrowserSession[]>([]);
  readonly authVia = signal<'core' | 'local'>('local');
  readonly coreDevicesUrl = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly done = signal('');
  readonly working = signal(false);
  readonly others = computed(() => this.sessions().filter(session => !session.current));
  readonly skeletonRows = Array.from({length: 3}, (_, index) => ({key: `s${index}`}));

  readonly browserIcon = browserIcon;
  readonly platformIcon = platformIcon;
  readonly deviceTitle = deviceTitle;
  readonly deviceSummary = deviceSummary;
  readonly deviceIcon = deviceIcon;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: response => {
        const data = response.payload.data;
        this.sessions.set(data?.sessions ?? []);
        this.authVia.set(data?.auth_via === 'core' ? 'core' : 'local');
        this.coreDevicesUrl.set(data?.core_devices_url || null);
      },
      error: response => {
        this.sessions.set([]);
        this.error.set(errorMessage(response, 'No se pudieron cargar tus dispositivos. Inténtalo nuevamente.'));
      },
    });
  }

  askClose(event: Event, session: BrowserSession): void {
    this.confirmation.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Se cerrará la sesión de Academical en ese dispositivo.',
      acceptLabel: 'Cerrar sesión',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {severity: 'danger', size: 'small'},
      rejectButtonProps: {severity: 'secondary', outlined: true, size: 'small'},
      accept: () => this.run(this.service.close(session.key)),
    });
  }

  askCloseOthers(event: Event): void {
    const count = this.others().length;

    this.confirmation.confirm({
      target: event.currentTarget as EventTarget,
      message: count === 1 ? 'Se cerrará la sesión de Academical en el otro dispositivo.' : `Se cerrará la sesión de Academical en los otros ${count} dispositivos.`,
      acceptLabel: 'Cerrar en los demás',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {severity: 'danger', size: 'small'},
      rejectButtonProps: {severity: 'secondary', outlined: true, size: 'small'},
      accept: () => this.run(this.service.closeOthers()),
    });
  }

  /** Core's own «Dispositivos y sesiones», to close Core too on the other devices. */
  goToCore(): void {
    const url = this.coreDevicesUrl();

    if (url) {
      this.navigate(url);
    }
  }

  /** Leaves Academical for another address (separate so the tests do not leave the page). */
  navigate(url: string): void {
    window.location.assign(url);
  }

  private run(request: Observable<ApiData<unknown>>): void {
    this.working.set(true);
    this.error.set('');
    this.done.set('');
    request.pipe(finalize(() => this.working.set(false))).subscribe({
      next: response => {
        this.done.set(response.payload?.message ?? 'Sesión cerrada.');
        this.load();
      },
      error: response => this.error.set(errorMessage(response, 'No se pudo cerrar la sesión. Inténtalo nuevamente.')),
    });
  }
}
