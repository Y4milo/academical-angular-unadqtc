import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FileSelectEvent, FileUpload, FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { DirectiveAccess, DirectiveDetail, DirectiveRoute, DirectivesService, DocumentTypeOption } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { DirectiveRouteStepsComponent } from '../directive-route-steps/directive-route-steps.component';
import { DirectiveLogDrawerComponent } from '../directive-tracking/directive-log-drawer.component';
import { DirectiveTrackingComponent } from '../directive-tracking/directive-tracking.component';
import { formatBytes } from '../directive-status';
import { PageCount, countPdfPages, pagesLabel, pagesTag } from '../pdf-pages';

/** Hasta cuántas oficinas se muestran como tarjetas de elección; con más vuelve el desplegable con buscador. */
export const MAX_ORIGIN_CARDS = 4;

const LAST_ORIGIN_KEY = 'directives.lastOrigin';

/** El PDF más grande que se acepta, igual que en el servidor (`DIRECTIVES_MAX_PDF_KB`). */
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

/**
 * Crear una directiva (o corregir su borrador): el título, si es de un proceso de calidad y los dos PDF, la directiva sin firmar y la resolución
 * que la aprueba, que son obligatorios. La oficina de origen viene del perfil que Core le dio a la persona: con una sola no se pregunta (se
 * muestra como dato), con varias se elige (tarjetas hasta 4, desplegable desde 5) y al corregir un borrador queda fija. A un lado se ve la ruta de firmas con la persona designada en
 * cada oficina, que cambia con la oficina y con la opción de calidad.
 */
@Component({
  selector: 'app-directive-form',
  imports: [FormsModule, ButtonModule, FileUploadModule, InputTextModule, MessageModule, SelectModule, SelectButtonModule, SkeletonModule, TagModule, ToggleSwitchModule, DirectiveRouteStepsComponent, DirectiveTrackingComponent, DirectiveLogDrawerComponent],
  templateUrl: './directive-form.component.html',
  styleUrl: './directive-form.component.css',
})
export class DirectiveFormComponent implements OnInit {
  readonly id = signal<number | null>(null);
  readonly access = signal<DirectiveAccess | null>(null);
  readonly existing = signal<DirectiveDetail | null>(null);
  /** El cajón del seguimiento (botón «Seguimiento» de la cabecera). */
  readonly trackingOpen = signal(false);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly types = signal<DocumentTypeOption[]>([]);
  readonly documentType = signal<string | null>(null);
  readonly documentSubtype = signal<string | null>(null);
  readonly title = signal('');
  readonly origin = signal<string | null>(null);
  readonly quality = signal(false);
  readonly directiveFile = signal<File | null>(null);
  readonly resolutionFile = signal<File | null>(null);
  /** Las páginas de cada PDF elegido, contadas en el navegador. */
  readonly directivePages = signal<PageCount>(undefined);
  readonly resolutionPages = signal<PageCount>(undefined);
  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly serverError = signal('');
  readonly fileError = signal<{ directive: string; resolution: string }>({ directive: '', resolution: '' });
  /** Qué zona de archivo tiene encima un archivo arrastrado, para resaltarla. */
  readonly dragging = signal<'directive' | 'resolution' | null>(null);
  readonly maxPdfMb = MAX_PDF_BYTES / (1024 * 1024);

  readonly route = signal<DirectiveRoute | null>(null);
  readonly routeLoading = signal(false);
  readonly routeError = signal('');

  readonly editing = computed(() => this.id() !== null);
  /** Los subtipos del tipo elegido: solo «Documentos de gestión institucional» los tiene y entonces el subtipo es obligatorio. */
  readonly subtypeOptions = computed(() => this.types().find(type => type.code === this.documentType())?.subtypes ?? []);
  readonly needsSubtype = computed(() => this.subtypeOptions().length > 0);
  readonly originOptions = computed(() => {
    const access = this.access();

    return (access?.request_units ?? []).map(code => ({ code, name: access?.request_unit_names?.[code] ?? code }));
  });
  readonly fixedOrigin = computed(() => this.editing() || this.originOptions().length === 1);
  readonly originName = computed(() => this.originOptions().find(option => option.code === this.origin())?.name ?? this.existing()?.origin.name ?? this.origin() ?? '');
  readonly originAsCards = computed(() => !this.fixedOrigin() && this.originOptions().length <= MAX_ORIGIN_CARDS);
  /** El cajón de la ruta de firmas (botón «Ruta de firmas» de la cabecera). */
  readonly routeOpen = signal(false);
  readonly routeSummary = computed<{ label: string; severity: 'success' | 'warn' } | null>(() => {
    const route = this.route();
    if (!route) return null;
    const missing = route.issues.length;
    const ready = route.steps.filter(step => !step.skipped).length - missing;

    return missing > 0 ? { label: missing === 1 ? 'Falta 1' : `Faltan ${missing}`, severity: 'warn' } : { label: ready === 1 ? '1 lista' : `${ready} listas`, severity: 'success' };
  });
  /** La franja de arriba: dice sin abrir el cajón si la ruta está lista o a quién le falta una persona designada. */
  readonly routeStrip = computed<{ tone: 'ok' | 'warn' | 'info'; icon: string; title: string; text: string }>(() => {
    const route = this.route();
    if (!this.origin()) return { tone: 'info', icon: 'pi-info-circle', title: 'Elige la oficina de origen', text: 'Con ella se arma la ruta de firmas.' };
    if (this.routeLoading() && !route) return { tone: 'info', icon: 'pi-spin pi-spinner', title: 'Armando la ruta de firmas…', text: 'Consultando a Core quién firma en cada oficina.' };
    if (!route) return { tone: 'warn', icon: 'pi-exclamation-triangle', title: 'No se pudo armar la ruta', text: this.routeError() || 'Inténtalo nuevamente.' };
    const steps = route.steps.filter(step => !step.skipped).length;
    const missing = route.issues.length;
    if (missing > 0) return { tone: 'warn', icon: 'pi-exclamation-triangle', title: missing === 1 ? 'Falta alguien en la ruta' : `Faltan ${missing} personas en la ruta`, text: 'Core no tiene firmante designado en esas oficinas: puedes guardar el borrador, pero no enviarlo a firma.' };

    return { tone: 'ok', icon: 'pi-verified', title: `Ruta lista: ${steps === 1 ? '1 oficina' : `${steps} oficinas`}, todas con firmante designado`, text: 'Cambia si eliges otra oficina de origen o activas «proceso de calidad».' };
  });
  /** Cuántos pasos tiene la ruta: es el número del botón «Ruta de firmas». */
  readonly routeCount = computed(() => this.route()?.steps.filter(step => !step.skipped).length ?? 0);
  readonly errors = computed<Record<string, string>>(() => {
    const errors: Record<string, string> = {};
    if (!this.documentType()) errors['type'] = 'Elige el tipo de documento.';
    if (this.documentType() && this.needsSubtype() && !this.documentSubtype()) errors['subtype'] = 'Elige el subtipo: es obligatorio para los documentos de gestión institucional.';
    if (this.title().trim().length < 5) errors['title'] = 'Escribe el título del documento (mínimo 5 letras).';
    if (!this.origin()) errors['origin'] = 'Elige la oficina de origen.';
    if (!this.editing() && !this.directiveFile()) errors['directive'] = 'Sube el documento en PDF.';
    if (!this.editing() && !this.resolutionFile()) errors['resolution'] = 'Sube la resolución que lo aprueba: es obligatoria.';
    if (this.fileError().directive) errors['directive'] = this.fileError().directive;
    if (this.fileError().resolution) errors['resolution'] = this.fileError().resolution;

    return errors;
  });
  readonly formatBytes = formatBytes;
  readonly pagesTag = pagesTag;
  readonly pagesLabel = pagesLabel;
  /** El total del expediente cuando se conocen las páginas de los dos PDF (el elegido o, al corregir, el que ya estaba). */
  readonly totalPages = computed<{ directive: number; resolution: number; total: number } | null>(() => {
    const known = (file: File | null, pages: PageCount, saved?: number | null): number | null => (file ? (typeof pages === 'number' ? pages : null) : (saved ?? null));
    const directive = known(this.directiveFile(), this.directivePages(), this.existing()?.files?.directive?.pages);
    const resolution = known(this.resolutionFile(), this.resolutionPages(), this.existing()?.files?.resolution?.pages);

    return directive === null || resolution === null ? null : { directive, resolution, total: directive + resolution };
  });

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
          this.fail('Core no te autoriza a pedir documentos.');

          return;
        }

        this.access.set(response.payload.data);
        this.loadTypes();

        if (this.id() === null) {
          const units = response.payload.data.request_units;
          this.loading.set(false);
          this.origin.set(units.length === 1 ? units[0] : this.lastOrigin(units));

          return;
        }

        this.service.detail(this.id()!).subscribe({
          next: detail => {
            this.loading.set(false);
            if (detail.status !== STATUS.success || !detail.payload.data.can_edit) {
              this.fail('Este documento ya no se puede corregir.');

              return;
            }
            const directive = detail.payload.data;
            this.existing.set(directive);
            this.title.set(directive.title);
            this.documentType.set(directive.document_type?.code ?? null);
            this.documentSubtype.set(directive.document_subtype?.code ?? null);
            this.quality.set(directive.is_quality);
            this.origin.set(directive.origin.code);
          },
          error: () => this.fail('No se pudo consultar el documento.'),
        });
      },
      error: () => this.fail('No se pudo consultar a Core. Inténtalo nuevamente.'),
    });
  }

  private loadTypes(): void {
    this.service.types().subscribe({
      next: response => {
        if (response.status === STATUS.success) this.types.set(response.payload.data);
        else this.serverError.set(response.payload?.message || 'No se pudieron consultar los tipos de documento.');
      },
      error: () => this.serverError.set('No se pudieron consultar los tipos de documento. Recarga la página.'),
    });
  }

  /** Cambiar de tipo borra el subtipo: el que se había elegido ya no corresponde. */
  selectType(code: string | null): void {
    if (code !== this.documentType()) this.documentSubtype.set(null);
    this.documentType.set(code);
  }

  /** La oficina por la que la persona pidió la última vez, si sigue autorizada; es solo comodidad, así que no falla si el navegador no deja guardar. */
  private lastOrigin(units: string[]): string | null {
    try {
      const last = localStorage.getItem(LAST_ORIGIN_KEY);

      return last !== null && units.includes(last) ? last : null;
    } catch {
      return null;
    }
  }

  private rememberOrigin(origin: string): void {
    try {
      localStorage.setItem(LAST_ORIGIN_KEY, origin);
    } catch {
      /* sin almacenamiento solo se pierde la comodidad */
    }
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
    const label = kind === 'directive' ? 'El documento' : 'La resolución';
    let problem = '';

    if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      problem = `${label} debe ser un PDF.`;
    } else if (file && file.size > MAX_PDF_BYTES) {
      problem = `${label} pesa ${formatBytes(file.size)}; el máximo es ${formatBytes(MAX_PDF_BYTES)}.`;
    }

    this.fileError.update(current => ({ ...current, [kind]: problem }));
    const chosen = kind === 'directive' ? this.directiveFile : this.resolutionFile;
    const pages = kind === 'directive' ? this.directivePages : this.resolutionPages;
    chosen.set(problem ? null : file);
    pages.set(undefined);

    if (!problem && file) {
      pages.set('reading');
      // Si mientras se contaba se eligió otro archivo, ese resultado ya no vale.
      void countPdfPages(file).then(count => { if (chosen() === file) pages.set(count); });
    }
  }

  dragOver(kind: 'directive' | 'resolution', event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(kind);
  }

  /** Un PDF soltado en la zona; si se sueltan varios se toma el primero, igual que al elegir. */
  dropFile(kind: 'directive' | 'resolution', event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(null);
    const files = [...(event.dataTransfer?.files ?? [])];
    if (files.length > 0) this.pick(kind, { files });
  }

  /** El PDF elegido con `p-fileupload`; se vacía el componente para poder elegir el mismo archivo otra vez. */
  pickFromUpload(kind: 'directive' | 'resolution', event: FileSelectEvent, upload: FileUpload): void {
    this.pick(kind, { files: event.currentFiles ?? event.files });
    upload.clear();
  }

  save(): void {
    this.submitted.set(true);
    this.serverError.set('');

    if (this.saving() || Object.keys(this.errors()).length > 0) return;

    const body = new FormData();
    body.append('title', this.title().trim());
    body.append('document_type', this.documentType()!);
    if (this.needsSubtype()) body.append('document_subtype', this.documentSubtype()!);
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
          if (!this.editing()) this.rememberOrigin(this.origin()!);
          this.notificationService.notifyApiData(response);
          this.router.navigateByUrl(`${PATHS.directives.link}/${response.payload.data.id}`);
        } else {
          this.serverError.set(response.payload?.message || 'No se pudo guardar el documento.');
        }
      },
      error: error => {
        this.saving.set(false);
        const payload = error?.error?.payload;
        const firstValidation = error?.error?.errors ? (Object.values(error.error.errors) as string[][])[0]?.[0] : null;
        this.serverError.set(payload?.message || firstValidation || 'No se pudo guardar el documento. Inténtalo nuevamente.');
      },
    });
  }

  cancel(): void {
    this.router.navigateByUrl(this.editing() ? `${PATHS.directives.link}/${this.id()}` : PATHS.directives.link);
  }
}
