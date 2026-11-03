import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { DirectiveAccess, DirectiveDetail, DirectiveRoute, DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { DirectiveRouteStepsComponent } from '../directive-route-steps/directive-route-steps.component';
import { formatBytes } from '../directive-status';

/** El PDF más grande que se acepta, igual que en el servidor (`DIRECTIVES_MAX_PDF_KB`). */
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

/**
 * Crear una directiva (o corregir su borrador): el título, la oficina de origen que Core autoriza, si es de un proceso de calidad y los dos PDF,
 * la directiva sin firmar y la resolución que la aprueba, que son obligatorios. A un lado se ve la ruta de firmas con la persona designada en
 * cada oficina, que cambia con la oficina y con la opción de calidad.
 */
@Component({
  selector: 'app-directive-form',
  imports: [FormsModule, ButtonModule, InputTextModule, MessageModule, SelectModule, SkeletonModule, ToggleSwitchModule, DirectiveRouteStepsComponent],
  templateUrl: './directive-form.component.html',
  styleUrl: './directive-form.component.css',
})
export class DirectiveFormComponent implements OnInit {
  readonly id = signal<number | null>(null);
  readonly access = signal<DirectiveAccess | null>(null);
  readonly existing = signal<DirectiveDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly title = signal('');
  readonly origin = signal<string | null>(null);
  readonly quality = signal(false);
  readonly directiveFile = signal<File | null>(null);
  readonly resolutionFile = signal<File | null>(null);
  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly serverError = signal('');
  readonly fileError = signal<{ directive: string; resolution: string }>({ directive: '', resolution: '' });

  readonly route = signal<DirectiveRoute | null>(null);
  readonly routeLoading = signal(false);
  readonly routeError = signal('');

  readonly editing = computed(() => this.id() !== null);
  readonly originOptions = computed(() => {
    const access = this.access();

    return (access?.request_units ?? []).map(code => ({ code, name: access?.request_unit_names?.[code] ?? code }));
  });
  readonly errors = computed<Record<string, string>>(() => {
    const errors: Record<string, string> = {};
    if (this.title().trim().length < 5) errors['title'] = 'Escribe el título de la directiva (mínimo 5 letras).';
    if (!this.origin()) errors['origin'] = 'Elige la oficina de origen.';
    if (!this.editing() && !this.directiveFile()) errors['directive'] = 'Sube la directiva en PDF.';
    if (!this.editing() && !this.resolutionFile()) errors['resolution'] = 'Sube la resolución que la aprueba: es obligatoria.';
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
  ) {
    // La ruta se vuelve a pedir a Core cuando cambia la oficina de origen o la opción de calidad.
    effect(() => {
      const origin = this.origin();
      const quality = this.quality();

      if (origin) {
        this.loadRoute(origin, quality);
      } else {
        this.route.set(null);
      }
    });
  }

  ngOnInit(): void {
    const id = Number(this.activatedRoute.snapshot.paramMap.get('id'));
    this.id.set(Number.isFinite(id) && id > 0 ? id : null);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.service.access().subscribe({
      next: response => {
        if (response.status !== STATUS.success || !response.payload.data.can_request) {
          this.fail('Core no te autoriza a pedir directivas.');

          return;
        }

        this.access.set(response.payload.data);

        if (this.id() === null) {
          const units = response.payload.data.request_units;
          this.loading.set(false);
          if (units.length === 1) this.origin.set(units[0]);

          return;
        }

        this.service.detail(this.id()!).subscribe({
          next: detail => {
            this.loading.set(false);
            if (detail.status !== STATUS.success || !detail.payload.data.can_edit) {
              this.fail('Esta directiva ya no se puede corregir.');

              return;
            }
            const directive = detail.payload.data;
            this.existing.set(directive);
            this.title.set(directive.title);
            this.quality.set(directive.is_quality);
            this.origin.set(directive.origin.code);
          },
          error: () => this.fail('No se pudo consultar la directiva.'),
        });
      },
      error: () => this.fail('No se pudo consultar a Core. Inténtalo nuevamente.'),
    });
  }

  private fail(message: string): void {
    this.loading.set(false);
    this.loadError.set(message);
  }

  private loadRoute(origin: string, quality: boolean): void {
    this.routeLoading.set(true);
    this.routeError.set('');
    this.service.route(origin, quality).subscribe({
      next: response => {
        this.routeLoading.set(false);
        if (response.status === STATUS.success) {
          this.route.set(response.payload.data);
        } else {
          this.route.set(null);
          this.routeError.set(response.payload?.message || 'No se pudo armar la ruta de firmas.');
        }
      },
      error: error => {
        this.routeLoading.set(false);
        this.route.set(null);
        this.routeError.set(error?.error?.payload?.message || 'No se pudo consultar a Core quién firma en cada oficina.');
      },
    });
  }

  pick(kind: 'directive' | 'resolution', event: { files?: File[] }): void {
    const file = event.files?.[0] ?? null;
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

  /** El PDF elegido con el selector de archivos del navegador (oculto tras el botón); se vacía para poder elegir el mismo otra vez. */
  pickFromInput(kind: 'directive' | 'resolution', event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pick(kind, { files: Array.from(input.files ?? []) });
    input.value = '';
  }

  save(): void {
    this.submitted.set(true);
    this.serverError.set('');

    if (this.saving() || Object.keys(this.errors()).length > 0) return;

    const body = new FormData();
    body.append('title', this.title().trim());
    body.append('is_quality', this.quality() ? '1' : '0');
    if (!this.editing()) body.append('origin', this.origin()!);
    if (this.directiveFile()) body.append('directive', this.directiveFile()!);
    if (this.resolutionFile()) body.append('resolution', this.resolutionFile()!);

    this.saving.set(true);
    const request = this.editing() ? this.service.update(this.id()!, body) : this.service.create(body);

    request.subscribe({
      next: response => {
        this.saving.set(false);
        if (response.status === STATUS.success) {
          this.notificationService.notifyApiData(response);
          this.router.navigateByUrl(`${PATHS.directives.link}/${response.payload.data.id}`);
        } else {
          this.serverError.set(response.payload?.message || 'No se pudo guardar la directiva.');
        }
      },
      error: error => {
        this.saving.set(false);
        const payload = error?.error?.payload;
        const firstValidation = error?.error?.errors ? (Object.values(error.error.errors) as string[][])[0]?.[0] : null;
        this.serverError.set(payload?.message || firstValidation || 'No se pudo guardar la directiva. Inténtalo nuevamente.');
      },
    });
  }

  cancel(): void {
    this.router.navigateByUrl(this.editing() ? `${PATHS.directives.link}/${this.id()}` : PATHS.directives.link);
  }
}
