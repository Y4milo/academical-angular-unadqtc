import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { DirectiveAccess, DirectiveStatus, DirectiveSummary, DirectivesService, PendingDirective } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { DIRECTIVE_STATUS } from '../directive-status';
import { SUBTYPE_DOCUMENT_TYPE, documentTypeColor, documentTypeText } from '../document-type';

type StatusFilter = DirectiveStatus | 'all';
type Section = 'mine' | 'pending' | 'route';

/**
 * Las directivas de las oficinas por las que Core autoriza a pedirlas (estado y a dónde llegó) y, para quien Core designa a firmar, las que
 * esperan su firma hoy. Una persona puede tener las dos cosas.
 */
@Component({
  selector: 'app-directives-list',
  imports: [DatePipe, FormsModule, ButtonModule, MessageModule, SelectButtonModule, SkeletonModule, TableModule, TagModule],
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
  readonly documentTypeColor = documentTypeColor;
  readonly documentTypeText = documentTypeText;

  readonly skeletonRows = [1, 2, 3, 4];
  readonly filterOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Borrador', value: 'draft' },
    { label: 'En firma', value: 'in_signature' },
    { label: 'Devueltas', value: 'returned' },
    { label: 'Firmadas', value: 'signed' },
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
    return rows.filter(row => (this.typeFilter() === null || row.document_type.code === this.typeFilter()) && (this.subtypeFilter() === null || row.document_subtype?.code === this.subtypeFilter()));
  }
  readonly participatingRows = computed(() => this.byType(this.participating()));
  readonly pendingRows = computed(() => this.byType(this.pending()));
  readonly visible = computed(() => this.byType(this.filter() === 'all' ? this.directives() : this.directives().filter(row => row.status === this.filter())));
  readonly rows = computed<unknown[]>(() => (this.loading() ? this.skeletonRows : this.visible()));
  readonly canRequest = computed(() => this.access()?.can_request === true);
  readonly canSign = computed(() => this.access()?.can_sign === true);
  readonly sectionOptions = computed<{ label: string; value: Section }[]>(() => [
    ...(this.canRequest() ? [{ label: 'Mis documentos', value: 'mine' as Section }] : []),
    ...(this.canSign() ? [{ label: `Por firmar${this.pending().length > 0 ? ` (${this.pending().length})` : ''}`, value: 'pending' as Section }] : []),
    ...(this.participating().length > 0 ? [{ label: `En tu ruta (${this.participating().length})`, value: 'route' as Section }] : []),
  ]);

  /** Cambiar de sección o de tipo empieza de nuevo: el filtro de una sección no tiene por qué existir en la otra. */
  changeSection(value: Section | null): void {
    this.section.set(value ?? 'mine');
    this.typeFilter.set(null);
    this.subtypeFilter.set(null);
  }

  changeType(code: string | null): void {
    this.typeFilter.set(code ?? null);
    this.subtypeFilter.set(null);
  }

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
