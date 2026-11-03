import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, PrimeTemplate } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { DirectiveDetail, DirectiveEvent, DirectiveFileKind, DirectiveProgressStep, DirectiveRoute, DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { DirectiveRouteStepsComponent } from '../directive-route-steps/directive-route-steps.component';
import { DIRECTIVE_EVENT_LABELS, DIRECTIVE_NOTICE_FAILURES, DIRECTIVE_NOTICE_LABELS, DIRECTIVE_PROGRESS, DIRECTIVE_PROGRESS_CANCELLED, DIRECTIVE_PROGRESS_RETURNED, DIRECTIVE_SIGNED_FAILURES, DIRECTIVE_STATUS, formatBytes } from '../directive-status';

/**
 * Una directiva: su estado, los dos PDF, la ruta de firmas con la persona designada en cada oficina y su línea de tiempo. El borrador se corrige
 * o se elimina; enviarlo a firma se habilita cuando el firmador esté conectado.
 */
@Component({
  selector: 'app-directive-detail',
  imports: [DatePipe, FormsModule, PrimeTemplate, ButtonModule, CheckboxModule, ConfirmDialogModule, DialogModule, MessageModule, SkeletonModule, TagModule, TextareaModule, TimelineModule, TooltipModule, DirectiveRouteStepsComponent],
  providers: [ConfirmationService],
  templateUrl: './directive-detail.component.html',
  styleUrl: './directive-detail.component.css',
})
export class DirectiveDetailComponent implements OnInit {
  readonly directive = signal<DirectiveDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly route = signal<DirectiveRoute | null>(null);
  readonly routeLoading = signal(false);
  readonly routeError = signal('');
  readonly opening = signal<string | null>(null);
  readonly deleting = signal(false);
  readonly sending = signal(false);
  readonly sendError = signal('');

  readonly signedLoading = signal(false);
  readonly signedError = signal('');
  readonly codeCopied = signal(false);

  readonly cancelOpen = signal(false);
  readonly cancelReason = signal('');
  readonly cancelAck = signal(false);
  readonly cancelSending = signal(false);
  readonly cancelError = signal('');
  readonly reasonMax = 500;
  readonly reasonTooShort = computed(() => this.cancelReason().length > 0 && this.cancelReason().trim().length < 10);
  readonly canConfirmCancel = computed(() => this.cancelReason().trim().length >= 10 && this.cancelAck() && !this.cancelSending());

  readonly statuses = DIRECTIVE_STATUS;
  readonly formatBytes = formatBytes;
  readonly isDraft = computed(() => this.directive()?.status === 'draft');
  readonly canSend = computed(() => this.isDraft() && this.route()?.can_send === true);
  readonly sendBlockedReason = computed(() => {
    if (!this.isDraft() || this.canSend()) return '';
    if (this.routeLoading()) return 'Consultando a Core quién firma en cada oficina.';
    if (this.route() && !this.route()!.can_send) return 'Core no tiene a alguien designado en toda la ruta.';

    return 'No se pudo comprobar la ruta de firmas.';
  });

  constructor(
    private service: DirectivesService,
    private notificationService: NotificationService,
    private confirmation: ConfirmationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private get id(): number {
    return Number(this.activatedRoute.snapshot.paramMap.get('id'));
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.service.detail(this.id).subscribe({
      next: response => {
        this.loading.set(false);
        if (response.status !== STATUS.success) {
          this.loadError.set(response.payload?.message || 'No se pudo consultar la directiva.');

          return;
        }

        this.directive.set(response.payload.data);
        if (response.payload.data.status === 'draft') this.loadRoute(response.payload.data);
      },
      error: error => {
        this.loading.set(false);
        this.loadError.set(error?.status === 404 ? 'No encontramos esa directiva, o no es de tu oficina.' : 'No se pudo consultar la directiva. Inténtalo nuevamente.');
      },
    });
  }

  private loadRoute(directive: DirectiveDetail): void {
    this.routeLoading.set(true);
    this.routeError.set('');
    this.service.route(directive.origin.code, directive.is_quality).subscribe({
      next: response => {
        this.routeLoading.set(false);
        if (response.status === STATUS.success) {
          this.route.set(response.payload.data);
        } else {
          this.routeError.set(response.payload?.message || 'No se pudo armar la ruta de firmas.');
        }
      },
      error: error => {
        this.routeLoading.set(false);
        this.routeError.set(error?.error?.payload?.message || 'No se pudo consultar a Core quién firma en cada oficina.');
      },
    });
  }

  progressOf(step: DirectiveProgressStep) {
    const current = this.directive();
    const cancelled = current?.status === 'cancelled' ? DIRECTIVE_PROGRESS_CANCELLED[step.state] : undefined;
    if (cancelled) return cancelled;

    const returned = current?.status === 'returned' ? DIRECTIVE_PROGRESS_RETURNED[step.state] : undefined;
    if (!returned) return DIRECTIVE_PROGRESS[step.state];

    return step.state === 'signed' ? { ...returned, label: `Firmó la versión ${current!.returned?.version ?? current!.version}` } : returned;
  }

  /** Lo que explica por qué quien consulta ve esta directiva como la ve: no es de su oficina, es de su ruta. */
  readonly viewerNote = computed(() => {
    switch (this.directive()?.viewer) {
      case 'signed':
        return 'Tu oficina ya firmó esta directiva. La ves en modo consulta: solo puedes leerla.';
      case 'rejecter':
        return 'Tú devolviste esta directiva. La ves en modo consulta.';
      case 'pending':
        return 'Esta directiva pasará por tu oficina. La ves en modo consulta hasta que te toque firmar.';
      default:
        return '';
    }
  });

  eventLabel(event: DirectiveEvent): string {
    const data = event.data as { notice?: string; reason?: string };
    if (event.type === 'notice_sent') return `Aviso enviado: ${DIRECTIVE_NOTICE_LABELS[data.notice ?? ''] ?? 'aviso'}`;
    if (event.type === 'signed_copy_failed') return `No se pudo traer el documento firmado: ${DIRECTIVE_SIGNED_FAILURES[data.reason ?? ''] ?? 'error desconocido'}`;
    if (event.type === 'notice_failed') return `No se pudo avisar: ${DIRECTIVE_NOTICE_FAILURES[data.reason ?? ''] ?? 'no salió el correo'}`;

    return DIRECTIVE_EVENT_LABELS[event.type] ?? event.type;
  }

  /** Los avisos los envía Academical; los demás hechos los cuenta el firmador o una persona. */
  eventAuthor(event: DirectiveEvent): string {
    if (event.by?.nick) return event.by.nick;

    return event.type.startsWith('notice_') || event.type.startsWith('signed_copy_') ? 'Academical' : 'Firmador';
  }

  /** Lo que el hecho cuenta además: la oficina, la persona y, si la devolvió, su motivo. */
  eventDetail(event: DirectiveEvent): string {
    const data = event.data as { office?: string; person?: string; reason?: string; notice?: string; signatures?: number };
    if (event.type === 'signed_copy_saved') return data.signatures ? `${data.signatures} firmas` : '';
    if (event.type === 'signed_copy_failed') return 'se vuelve a intentar al pulsar «Descargar firmada»';
    if (event.type.startsWith('notice_')) {
      const to = [data.person ? `Para ${data.person}` : null, data.office].filter(Boolean).join(' · ');
      const pending = event.type === 'notice_failed' && data.notice === 'turn' ? 'la firma pendiente le aparece igual en «Por firmar»' : '';

      return [to, pending].filter(Boolean).join(' · ');
    }

    return [data.office, data.person, data.reason].filter(Boolean).join(' · ');
  }

  openFile(kind: DirectiveFileKind, version?: number): void {
    const directive = this.directive();
    if (!directive || this.opening()) return;
    // La pestaña se abre en el clic (antes de la espera) para que el navegador no la bloquee.
    const tab = window.open('', '_blank');
    this.opening.set(version ? `${kind}-${version}` : kind);

    this.service.file(directive.id, kind, version).subscribe({
      next: blob => {
        this.opening.set(null);
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        if (tab) {
          tab.location.href = url;
        } else {
          window.location.href = url;
        }
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        this.opening.set(null);
        tab?.close();
        this.notificationService.error('No se pudo abrir el PDF', 'Inténtalo nuevamente.');
      },
    });
  }

  edit(): void {
    this.router.navigateByUrl(`${PATHS.directives.link}/${this.directive()!.id}/editar`);
  }

  /** Descarga la directiva firmada. Si Academical aún no tiene la copia, la pide al firmador en ese momento; si no responde, se puede volver a intentar. */
  downloadSigned(): void {
    const directive = this.directive();
    if (!directive || this.signedLoading()) return;

    this.signedLoading.set(true);
    this.signedError.set('');
    this.service.file(directive.id, 'signed', directive.signed?.version).subscribe({
      next: blob => {
        this.signedLoading.set(false);
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = directive.signed?.name || 'directiva_firmada.pdf';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        if (directive.signed && !directive.signed.available) this.refresh();
      },
      error: async error => {
        this.signedLoading.set(false);
        this.signedError.set(await this.messageOf(error));
        this.refresh();
      },
    });
  }

  /** Vuelve a pedir la directiva sin mostrar la pantalla de carga: lo que cambió (la copia guardada, el intento fallido en el seguimiento) se ve en su sitio. */
  private refresh(): void {
    this.service.detail(this.id).subscribe({
      next: response => {
        if (response.status === STATUS.success) this.directive.set(response.payload.data);
      },
      error: () => undefined,
    });
  }

  copyCode(): void {
    const code = this.directive()?.signed?.code;
    if (!code) return;

    navigator.clipboard?.writeText(code).then(() => {
      this.codeCopied.set(true);
      setTimeout(() => this.codeCopied.set(false), 2000);
    }).catch(() => undefined);
  }

  /** El cuerpo de un error de descarga llega como archivo: se lee para mostrar lo que dijo el servidor. */
  private async messageOf(error: { error?: unknown }): Promise<string> {
    const fallback = 'No se pudo traer el documento firmado. Inténtalo de nuevo en unos minutos.';
    try {
      const body = error?.error instanceof Blob ? JSON.parse(await error.error.text()) : error?.error;

      return (body as { payload?: { message?: string } })?.payload?.message || fallback;
    } catch {
      return fallback;
    }
  }

  openCancel(): void {
    this.cancelError.set('');
    this.cancelOpen.set(true);
  }

  closeCancel(): void {
    if (!this.cancelSending()) this.cancelOpen.set(false);
  }

  /** Anula la directiva con el motivo: se cancela en el firmador, se avisa a la ruta y ya no se puede reabrir. */
  cancel(): void {
    const directive = this.directive();
    if (!directive || !this.canConfirmCancel()) return;

    this.cancelSending.set(true);
    this.cancelError.set('');
    this.service.cancel(directive.id, this.cancelReason().trim()).subscribe({
      next: response => {
        this.cancelSending.set(false);
        if (response.status === STATUS.success) {
          this.cancelOpen.set(false);
          this.cancelReason.set('');
          this.cancelAck.set(false);
          this.directive.set(response.payload.data);
          this.notificationService.notifyApiData(response);
        } else {
          this.cancelError.set(response.payload?.message || 'No se pudo anular la directiva.');
        }
      },
      error: error => {
        this.cancelSending.set(false);
        const firstValidation = error?.error?.errors ? (Object.values(error.error.errors) as string[][])[0]?.[0] : null;
        this.cancelError.set(error?.error?.payload?.message || firstValidation || 'No se pudo anular la directiva. Inténtalo nuevamente.');
      },
    });
  }

  resubmit(): void {
    this.router.navigateByUrl(`${PATHS.directives.link}/${this.directive()!.id}/corregir`);
  }

  sign(): void {
    this.router.navigateByUrl(`${PATHS.directives.link}/${this.directive()!.id}/firmar`);
  }

  back(): void {
    this.router.navigateByUrl(PATHS.directives.link);
  }

  askSend(): void {
    this.confirmation.confirm({
      header: 'Enviar a firma',
      message: `Se enviará la directiva con su resolución a ${this.route()?.steps.filter(step => !step.skipped).length ?? 0} oficinas, en orden. Después de enviarla ya no se puede corregir.`,
      acceptLabel: 'Enviar a firma',
      rejectLabel: 'Cancelar',
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.send(),
    });
  }

  private send(): void {
    this.sending.set(true);
    this.sendError.set('');
    this.service.send(this.directive()!.id).subscribe({
      next: response => {
        this.sending.set(false);
        if (response.status === STATUS.success) {
          this.notificationService.notifyApiData(response);
          this.directive.set(response.payload.data);
          this.route.set(null);
        } else {
          this.sendError.set(response.payload?.message || 'No se pudo enviar la directiva.');
        }
      },
      error: error => {
        this.sending.set(false);
        this.sendError.set(error?.error?.payload?.message || 'No se pudo enviar la directiva. Inténtalo nuevamente.');
      },
    });
  }

  askDelete(): void {
    this.confirmation.confirm({
      header: 'Eliminar el borrador',
      message: 'Se eliminará la directiva con sus dos PDF. Esta acción no se puede deshacer.',
      acceptLabel: 'Eliminar borrador',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.delete(),
    });
  }

  private delete(): void {
    this.deleting.set(true);
    this.service.remove(this.directive()!.id).subscribe({
      next: response => {
        this.deleting.set(false);
        this.notificationService.notifyApiData(response);
        if (response.status === STATUS.success) this.back();
      },
      error: error => {
        this.deleting.set(false);
        this.notificationService.notifyApiData(error);
      },
    });
  }
}
