import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, PrimeTemplate } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { DirectiveDetail, DirectiveEvent, DirectiveFileKind, DirectiveProgressStep, DirectiveRoute, DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { DirectiveRouteStepsComponent } from '../directive-route-steps/directive-route-steps.component';
import { DIRECTIVE_EVENT_LABELS, DIRECTIVE_PROGRESS, DIRECTIVE_STATUS, formatBytes } from '../directive-status';

/**
 * Una directiva: su estado, los dos PDF, la ruta de firmas con la persona designada en cada oficina y su línea de tiempo. El borrador se corrige
 * o se elimina; enviarlo a firma se habilita cuando el firmador esté conectado.
 */
@Component({
  selector: 'app-directive-detail',
  imports: [DatePipe, PrimeTemplate, ButtonModule, ConfirmDialogModule, MessageModule, SkeletonModule, TagModule, TimelineModule, TooltipModule, DirectiveRouteStepsComponent],
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
  readonly opening = signal<DirectiveFileKind | null>(null);
  readonly deleting = signal(false);
  readonly sending = signal(false);
  readonly sendError = signal('');

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
    return DIRECTIVE_PROGRESS[step.state];
  }

  eventLabel(event: DirectiveEvent): string {
    return DIRECTIVE_EVENT_LABELS[event.type] ?? event.type;
  }

  /** Lo que el hecho cuenta además: la oficina, la persona y, si la devolvió, su motivo. */
  eventDetail(event: DirectiveEvent): string {
    const data = event.data as { office?: string; person?: string; reason?: string };

    return [data.office, data.person, data.reason].filter(Boolean).join(' · ');
  }

  openFile(kind: DirectiveFileKind): void {
    const directive = this.directive();
    if (!directive || this.opening()) return;
    // La pestaña se abre en el clic (antes de la espera) para que el navegador no la bloquee.
    const tab = window.open('', '_blank');
    this.opening.set(kind);

    this.service.file(directive.id, kind).subscribe({
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
