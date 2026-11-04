import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FileSelectEvent, FileUpload, FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { DirectiveDetail, DirectiveRoute, DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { DirectiveRouteStepsComponent } from '../directive-route-steps/directive-route-steps.component';
import { MAX_PDF_BYTES } from '../directive-form/directive-form.component';
import { formatBytes } from '../directive-status';

/**
 * La oficina de origen corrige una directiva devuelta y la reenvía: sube la directiva corregida (obligatoria), conserva la resolución salvo que suba
 * otra (opcional) y la ruta empieza de cero con la versión siguiente. A un lado se ve el motivo de la devolución y la ruta con las personas que Core
 * tiene designadas hoy. Si el envío falla, la directiva sigue devuelta con su versión anterior.
 */
@Component({
  selector: 'app-directive-resubmit',
  imports: [FormsModule, ButtonModule, FileUploadModule, InputTextModule, MessageModule, SkeletonModule, TagModule, DirectiveRouteStepsComponent],
  templateUrl: './directive-resubmit.component.html',
  styleUrl: './directive-resubmit.component.css',
})
export class DirectiveResubmitComponent implements OnInit {
  readonly directive = signal<DirectiveDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly route = signal<DirectiveRoute | null>(null);
  readonly routeLoading = signal(false);
  readonly routeError = signal('');

  readonly title = signal('');
  readonly directiveFile = signal<File | null>(null);
  readonly resolutionFile = signal<File | null>(null);
  readonly fileError = signal<{ directive: string; resolution: string }>({ directive: '', resolution: '' });
  readonly submitted = signal(false);
  readonly sending = signal(false);
  readonly serverError = signal('');

  readonly nextVersion = computed(() => (this.directive()?.version ?? 1) + 1);
  readonly errors = computed<Record<string, string>>(() => {
    const errors: Record<string, string> = {};
    if (this.title().trim().length < 5) errors['title'] = 'Escribe el título de la directiva (mínimo 5 letras).';
    if (!this.directiveFile()) errors['directive'] = 'Sube la directiva corregida en PDF.';
    if (this.fileError().directive) errors['directive'] = this.fileError().directive;
    if (this.fileError().resolution) errors['resolution'] = this.fileError().resolution;

    return errors;
  });
  readonly formatBytes = formatBytes;

  constructor(
    private service: DirectivesService,
    private notificationService: NotificationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  private get id(): number {
    return Number(this.activatedRoute.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.service.detail(this.id).subscribe({
      next: response => {
        this.loading.set(false);
        if (response.status !== STATUS.success || !response.payload.data.can_resubmit) {
          this.loadError.set('Esta directiva no se puede corregir: ya no está devuelta o no es de tu oficina.');

          return;
        }

        const directive = response.payload.data;
        this.directive.set(directive);
        this.title.set(directive.title);
        this.loadRoute(directive);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('No se pudo consultar la directiva. Inténtalo nuevamente.');
      },
    });
  }

  private loadRoute(directive: DirectiveDetail): void {
    this.routeLoading.set(true);
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

  /** El PDF elegido con `p-fileupload`; se vacía el componente para poder elegir el mismo archivo otra vez. */
  pickFromUpload(kind: 'directive' | 'resolution', event: FileSelectEvent, upload: FileUpload): void {
    this.pick(kind, (event.currentFiles ?? event.files)[0] ?? null);
    upload.clear();
  }

  pick(kind: 'directive' | 'resolution', file: File | null): void {
    const label = kind === 'directive' ? 'La directiva' : 'La resolución';
    let problem = '';

    if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      problem = `${label} debe ser un PDF.`;
    } else if (file && file.size > MAX_PDF_BYTES) {
      problem = `${label} pesa ${formatBytes(file.size)}; el máximo es ${formatBytes(MAX_PDF_BYTES)}.`;
    }

    this.fileError.update(current => ({ ...current, [kind]: problem }));
    (kind === 'directive' ? this.directiveFile : this.resolutionFile).set(problem ? null : file);
  }

  keepResolution(): void {
    this.resolutionFile.set(null);
    this.fileError.update(current => ({ ...current, resolution: '' }));
  }

  send(): void {
    this.submitted.set(true);
    this.serverError.set('');
    if (this.sending() || Object.keys(this.errors()).length > 0) return;

    const body = new FormData();
    body.append('title', this.title().trim());
    body.append('directive', this.directiveFile()!);
    if (this.resolutionFile()) body.append('resolution', this.resolutionFile()!);

    this.sending.set(true);
    this.service.resubmit(this.id, body).subscribe({
      next: response => {
        this.sending.set(false);
        if (response.status === STATUS.success) {
          this.notificationService.notifyApiData(response);
          this.router.navigateByUrl(`${PATHS.directives.link}/${this.id}`);
        } else {
          this.serverError.set(response.payload?.message || 'No se pudo reenviar la directiva.');
        }
      },
      error: error => {
        this.sending.set(false);
        const firstValidation = error?.error?.errors ? (Object.values(error.error.errors) as string[][])[0]?.[0] : null;
        this.serverError.set(error?.error?.payload?.message || firstValidation || 'No se pudo reenviar la directiva. Inténtalo nuevamente.');
      },
    });
  }

  cancel(): void {
    this.router.navigateByUrl(`${PATHS.directives.link}/${this.id}`);
  }
}
