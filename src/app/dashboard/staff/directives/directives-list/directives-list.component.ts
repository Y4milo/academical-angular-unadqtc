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

type StatusFilter = DirectiveStatus | 'all';
type Section = 'mine' | 'pending';

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

  readonly skeletonRows = [1, 2, 3, 4];
  readonly filterOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Borrador', value: 'draft' },
    { label: 'En firma', value: 'in_signature' },
    { label: 'Devueltas', value: 'returned' },
    { label: 'Firmadas', value: 'signed' },
  ];
  readonly visible = computed(() => (this.filter() === 'all' ? this.directives() : this.directives().filter(row => row.status === this.filter())));
  readonly rows = computed<unknown[]>(() => (this.loading() ? this.skeletonRows : this.visible()));
  readonly canRequest = computed(() => this.access()?.can_request === true);
  readonly canSign = computed(() => this.access()?.can_sign === true);
  readonly sectionOptions = computed<{ label: string; value: Section }[]>(() => [
    { label: 'Mis directivas', value: 'mine' },
    { label: `Por firmar${this.pending().length > 0 ? ` (${this.pending().length})` : ''}`, value: 'pending' },
  ]);

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

  sign(directive: DirectiveSummary): void {
    this.router.navigateByUrl(`${PATHS.directives.link}/${directive.id}/firmar`);
  }

  statusOf(status: DirectiveStatus) {
    return DIRECTIVE_STATUS[status];
  }

  private fail(message?: string): void {
    this.loading.set(false);
    this.loadError.set(message || 'No se pudieron consultar las directivas. Inténtalo nuevamente.');
  }

  create(): void {
    this.router.navigateByUrl(PATHS.directives.new.link);
  }

  open(directive: DirectiveSummary): void {
    this.router.navigateByUrl(`${PATHS.directives.link}/${directive.id}`);
  }
}
