import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { DirectiveAccess, DirectiveStatus, DirectiveSummary, DirectivesService, PendingDirective } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { DIRECTIVE_STATUS } from '../directive-status';
import { pagesLabel } from '../pdf-pages';
import { SUBTYPE_DOCUMENT_TYPE, documentTypeColor, documentTypeText } from '../document-type';

type StatusFilter = DirectiveStatus | 'all';
type Section = 'mine' | 'pending' | 'route';

/**
 * Las directivas de las oficinas por las que Core autoriza a pedirlas (estado y a dónde llegó) y, para quien Core designa a firmar, las que
 * esperan su firma hoy. Una persona puede tener las dos cosas.
 */
@Component({
  selector: 'app-directives-list',
  imports: [CardModule, DatePipe, NgTemplateOutlet, FormsModule, BadgeModule, ButtonModule, ChipModule, DialogModule, IconFieldModule, InputIconModule, InputTextModule, MessageModule, SelectButtonModule, SkeletonModule, TableModule, TabsModule, TagModule],
  templateUrl: './directives-list.component.html',
  styleUrl: './directives-list.component.css',
})
export class DirectivesListComponent implements OnInit {
  readonly access = signal<DirectiveAccess | null>(null);
  readonly directives = signal<DirectiveSummary[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly filter = signal<StatusFilter>('all');
  readonly pending = signal<PendingDirective[]>([]);
  readonly section = signal<Section>('mine');
  /** Las directivas enviadas en cuya ruta de firmas está la persona, para seguirlas en modo consulta aunque no las pida. */
  readonly participating = signal<DirectiveSummary[]>([]);

  /** El tipo (y el subtipo, en gestión institucional) por el que se filtra lo que se ve; nulo es «Todos». */
  readonly typeFilter = signal<string | null>(null);
  readonly subtypeFilter = signal<string | null>(null);
  /** Lo que se escribe en el buscador: filtra por título, oficina de origen y tipo. */
  readonly search = signal('');
  readonly filtersOpen = signal(false);
  /** En el celular cada documento es una tarjeta en vez de una fila. */
  private readonly media = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 640px)') : null;
  readonly isMobile = signal(this.media?.matches ?? false);
  readonly documentTypeColor = documentTypeColor;
  readonly documentTypeText = documentTypeText;

  readonly skeletonRows = [1, 2, 3, 4];
  readonly filterOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Borrador', value: 'draft' },
    { label: 'En firma', value: 'in_signature' },
    { label: 'Devueltos', value: 'returned' },
    { label: 'Firmados', value: 'signed' },
  ];
  /** Lo que muestra la sección elegida, antes de filtrar por tipo: de ahí salen los tipos que se ofrecen y cuántos hay de cada uno. */
  private readonly sectionRows = computed<DirectiveSummary[]>(() => {
    switch (this.section()) {
      case 'route': return this.participating();
      case 'pending': return this.pending();
      default: return this.directives();
    }
  });
  readonly typeOptions = computed<{ label: string; value: string | null; code: string | null }[]>(() => {
    const rows = this.sectionRows();
    const counts = new Map<string, { label: string; count: number }>();
    for (const row of rows) counts.set(row.document_type.code, { label: row.document_type.label, count: (counts.get(row.document_type.code)?.count ?? 0) + 1 });
    const types = [...counts.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label, 'es')).map(([code, item]) => ({ label: `${item.label} (${item.count})`, value: code, code }));

    return types.length > 1 || this.typeFilter() !== null ? [{ label: `Todos (${rows.length})`, value: null, code: null }, ...types] : [];
  });
  readonly subtypeOptions = computed<{ label: string; value: string | null }[]>(() => {
    if (this.typeFilter() !== SUBTYPE_DOCUMENT_TYPE) return [];
    const counts = new Map<string, { label: string; count: number }>();
    for (const row of this.sectionRows().filter(item => item.document_type.code === SUBTYPE_DOCUMENT_TYPE && item.document_subtype)) {
      const sub = row.document_subtype!;
      counts.set(sub.code, { label: sub.label, count: (counts.get(sub.code)?.count ?? 0) + 1 });
    }

    return counts.size === 0 ? [] : [{ label: 'Todos los subtipos', value: null }, ...[...counts.entries()].map(([code, item]) => ({ label: `${item.label} (${item.count})`, value: code }))];
  });
  private byType<T extends DirectiveSummary>(rows: T[]): T[] {
    const query = this.search().trim().toLowerCase();

    return rows.filter(row => (this.typeFilter() === null || row.document_type.code === this.typeFilter())
      && (this.subtypeFilter() === null || row.document_subtype?.code === this.subtypeFilter())
      && (query === '' || `${row.title} ${row.origin.name} ${documentTypeText(row.document_type, row.document_subtype)}`.toLowerCase().includes(query)));
  }
  readonly participatingRows = computed(() => this.byType(this.participating()));
  readonly pendingRows = computed(() => this.byType(this.pending()));
  readonly visible = computed(() => this.byType(this.filter() === 'all' ? this.directives() : this.directives().filter(row => row.status === this.filter())));
  readonly rows = computed<unknown[]>(() => (this.loading() ? this.skeletonRows : this.visible()));
  readonly canRequest = computed(() => this.access()?.can_request === true);
  readonly canSign = computed(() => this.access()?.can_sign === true);
  readonly sectionOptions = computed<{ label: string; value: Section; count: number }[]>(() => [
    ...(this.canRequest() ? [{ label: 'Mis documentos', value: 'mine' as Section, count: 0 }] : []),
    ...(this.canSign() ? [{ label: 'Por firmar', value: 'pending' as Section, count: this.pending().length }] : []),
    ...(this.participating().length > 0 ? [{ label: 'En tu ruta', value: 'route' as Section, count: this.participating().length }] : []),
  ]);
  /** El buscador y los filtros solo salen cuando hay algo que filtrar (o ya hay algo aplicado, para poder quitarlo). */
  readonly showToolbar = computed(() => !this.loading() && (this.sectionRows().length > 0 || this.search().trim() !== '' || this.activeFilters().length > 0));
  /** Lo aplicado, para mostrarlo como etiquetas que se quitan una a una. */
  readonly activeFilters = computed<{ key: 'status' | 'type' | 'subtype'; label: string }[]>(() => {
    const result: { key: 'status' | 'type' | 'subtype'; label: string }[] = [];
    if (this.section() === 'mine' && this.filter() !== 'all') result.push({ key: 'status', label: `Estado: ${DIRECTIVE_STATUS[this.filter() as DirectiveStatus].label}` });
    const type = this.sectionRows().find(row => row.document_type.code === this.typeFilter())?.document_type.label;
    if (this.typeFilter() !== null) result.push({ key: 'type', label: `Tipo: ${type ?? this.typeFilter()}` });
    const subtype = this.sectionRows().find(row => row.document_subtype?.code === this.subtypeFilter())?.document_subtype?.label;
    if (this.subtypeFilter() !== null) result.push({ key: 'subtype', label: `Subtipo: ${subtype ?? this.subtypeFilter()}` });

    return result;
  });

  /** «14 páginas · » o «1 página · »; nada si el documento no trae su cuenta. */
  pagesText(directive: DirectiveSummary): string {
    const pages = directive.files?.directive?.pages;

    return pages ? `${pagesLabel(pages)} · ` : '';
  }

  stepsOf(total: number): number[] {
    return Array.from({ length: Math.max(0, total) }, (_, index) => index);
  }

  removeFilter(key: 'status' | 'type' | 'subtype'): void {
    if (key === 'status') this.filter.set('all');
    if (key === 'type') this.changeType(null);
    if (key === 'subtype') this.subtypeFilter.set(null);
  }

  clearFilters(): void {
    this.filter.set('all');
    this.typeFilter.set(null);
    this.subtypeFilter.set(null);
  }

  /** Cambiar de sección o de tipo empieza de nuevo: el filtro de una sección no tiene por qué existir en la otra. */
  changeSection(value: Section | null): void {
    this.section.set(value ?? 'mine');
    this.typeFilter.set(null);
    this.subtypeFilter.set(null);
    this.search.set('');
  }

  changeType(code: string | null): void {
    this.typeFilter.set(code ?? null);
    this.subtypeFilter.set(null);
  }

  constructor(
    private service: DirectivesService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    const onChange = (event: MediaQueryListEvent): void => this.isMobile.set(event.matches);
    this.media?.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener('change', onChange));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.service.access().subscribe({
      next: response => {
        if (response.status !== STATUS.success) {
          this.fail(response.payload?.message);

          return;
        }

        this.access.set(response.payload.data);
        if (response.payload.data.can_sign) this.loadPending();
        if (response.payload.data.can_sign || response.payload.data.can_request) this.loadParticipating();

        if (!response.payload.data.can_request) {
          this.loading.set(false);
          this.section.set('pending');

          return;
        }

        this.service.list().subscribe({
          next: list => {
            this.loading.set(false);
            if (list.status === STATUS.success) {
              this.directives.set(list.payload.data);
            } else {
              this.fail(list.payload?.message);
            }
          },
          error: () => this.fail(),
        });
      },
      error: () => this.fail(),
    });
  }

  private loadPending(): void {
    this.service.pending().subscribe({
      next: response => {
        if (response.status === STATUS.success) {
          this.pending.set(response.payload.data);
          // Quien tiene algo por firmar y nada propio empieza por lo que le toca.
          if (response.payload.data.length > 0 && this.directives().length === 0) this.section.set('pending');
        }
      },
      error: () => undefined,
    });
  }

  private loadParticipating(): void {
    this.service.participating().subscribe({
      next: response => {
        if (response.status === STATUS.success) this.participating.set(response.payload.data);
      },
      error: () => undefined,
    });
  }

  sign(directive: DirectiveSummary): void {
    this.router.navigateByUrl(`${PATHS.directives.link}/${directive.id}/firmar`);
  }

  statusOf(status: DirectiveStatus) {
    return DIRECTIVE_STATUS[status];
  }

  private fail(message?: string): void {
    this.loading.set(false);
    this.loadError.set(message || 'No se pudieron consultar los documentos. Inténtalo nuevamente.');
  }

  create(): void {
    this.router.navigateByUrl(PATHS.directives.new.link);
  }

  open(directive: DirectiveSummary): void {
    this.router.navigateByUrl(`${PATHS.directives.link}/${directive.id}`);
  }
}
