import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { PopoverModule } from 'primeng/popover';
import { Select } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { NotificationService } from '../../../../services/notification.service';
import {
  AccountingBnAttention,
  AccountingBnClient,
  AccountingBnCycleStep,
  AccountingBnFilePreview,
  AccountingBnFilter,
  AccountingBnIpStatus,
  AccountingBnListResponse,
  AccountingBnOverview,
  AccountingBnService,
  AccountingBnTransaction,
} from '../../../../services/accounting-bn.service';

interface SelectOption {
  label: string;
  value: string;
}

interface DayGroup {
  key: string;
  label: string;
  items: AccountingBnTransaction[];
}

type View = 'all' | 'incidents' | 'rejections';
type Severity = 'success' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'app-bn-incidents',
  imports: [
    AppLucideIconComponent,
    ButtonModule,
    DatePicker,
    DrawerModule,
    FormsModule,
    InputTextModule,
    NgClass,
    NgFor,
    NgIf,
    PaginatorModule,
    PopoverModule,
    RouterLink,
    Select,
    SkeletonModule,
    TagModule,
  ],
  templateUrl: './bn-incidents.component.html',
  styleUrl: './bn-incidents.component.css',
})
export class BnIncidentsComponent implements OnInit, OnDestroy {
  readonly today = new Date();
  readonly operationOptions: SelectOption[] = [
    { label: 'Todas', value: '' },
    { label: 'Subida .ING', value: 'upload' },
    { label: 'Pagos .PAGOS', value: 'payments' },
    { label: 'Validación .REP', value: 'process-result' },
    { label: 'Duplicados .DUP', value: 'duplicate' },
    { label: 'Acceso rechazado', value: 'access' },
  ];
  readonly originOptions: SelectOption[] = [
    { label: 'Todos', value: '' },
    { label: 'Autorizadas', value: 'allowed' },
    { label: 'Desconocidas', value: 'unknown' },
    { label: 'Sin verificar', value: 'unverified' },
  ];

  view: View = 'all';
  search = '';
  dateRange: Date[] = [];
  operation = '';
  origin = '';
  page = 1;
  perPage = 20;

  list: AccountingBnListResponse = {
    items: [],
    pagination: { current_page: 1, last_page: 1, per_page: 20, total: 0, from: null, to: null },
  };
  groups: DayGroup[] = [];
  overview: AccountingBnOverview | null = null;
  loading = true;
  overviewLoading = true;

  selected: AccountingBnTransaction | null = null;
  detailVisible = false;
  preview: AccountingBnFilePreview | null = null;
  previewLoading = false;
  downloadingId: number | null = null;

  private readonly search$ = new Subject<string>();
  private searchSub?: Subscription;

  constructor(
    private accountingBnService: AccountingBnService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadOverview();
    this.loadList(1);
    this.searchSub = this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => this.loadList(1));
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  // ------------------------------------------------------------------ datos

  loadOverview(): void {
    this.overviewLoading = true;
    this.accountingBnService.overview().subscribe({
      next: (response) => {
        this.overviewLoading = false;
        if (response.status === STATUS.success) {
          this.overview = response.payload.data;
        }
      },
      error: () => {
        this.overviewLoading = false;
      },
    });
  }

  loadList(page = 1): void {
    this.page = page;
    this.loading = true;
    this.accountingBnService.transactions(this.buildFilters()).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === STATUS.success) {
          this.list = response.payload.data;
          this.groups = this.buildGroups(this.list.items);
        } else {
          this.notificationService.notifyApiData(response);
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Error', 'No se pudo cargar el historial del Banco Nación.');
      },
    });
  }

  setView(view: View): void {
    if (this.view !== view) {
      this.view = view;
      this.loadList(1);
    }
  }

  onSearch(value: string): void {
    this.search = value;
    this.search$.next(value.trim());
  }

  applyFilters(popover: { hide: () => void }): void {
    popover.hide();
    this.loadList(1);
  }

  clearFilters(popover?: { hide: () => void }): void {
    this.dateRange = [];
    this.operation = '';
    this.origin = '';
    popover?.hide();
    this.loadList(1);
  }

  get activeFilters(): number {
    return [this.dateRange?.[0], this.operation, this.origin].filter(Boolean).length;
  }

  onPage(event: { page?: number; rows?: number }): void {
    this.perPage = event.rows ?? this.perPage;
    this.loadList((event.page ?? 0) + 1);
  }

  // ------------------------------------------------------------------ vista general

  get needsAttention(): number {
    return this.overview?.attention.length ?? 0;
  }

  stepIcon(step: AccountingBnCycleStep): string {
    switch (step.state) {
      case 'ok':
        return 'circle-check';
      case 'error':
        return 'triangle-alert';
      case 'missing':
        return 'circle-alert';
      default:
        return 'clock';
    }
  }

  stepText(step: AccountingBnCycleStep): string {
    switch (step.state) {
      case 'ok':
        return `Recibido ${this.hourOf(step.at)}`;
      case 'error':
        return `Con error ${this.hourOf(step.at)}`;
      case 'missing':
        return 'Aún sin archivo hoy';
      default:
        return step.window;
    }
  }

  attentionIcon(item: AccountingBnAttention): string {
    if (item.kind === 'security') {
      return 'shield-alert';
    }

    return item.origin === 'connection' ? 'plug-zap' : item.origin === 'credentials' ? 'key-round' : 'triangle-alert';
  }

  reviewIncidents(): void {
    this.setView('incidents');
  }

  // ------------------------------------------------------------------ filas

  rowStatus(row: AccountingBnTransaction): { label: string; severity: Severity } {
    if (row.operation.value === 'access') {
      return { label: 'Rechazado', severity: 'danger' };
    }

    if (row.is_expected) {
      return { label: 'Esperado', severity: 'secondary' };
    }

    return row.status.value === 'error'
      ? { label: 'Error', severity: 'danger' }
      : { label: row.status.label || 'Correcto', severity: 'success' };
  }

  opIcon(row: AccountingBnTransaction): string {
    switch (row.operation.value) {
      case 'upload':
        return 'upload';
      case 'access':
        return 'key-round';
      default:
        return 'download';
    }
  }

  fileLine(row: AccountingBnTransaction): string {
    const name = row.file_path ? this.basename(row.file_path) : row.file_name;

    return name && row.file_size ? `${name} · ${this.formatSize(row.file_size)}` : row.message || '-';
  }

  clientIcon(client: AccountingBnClient | null | undefined): string {
    switch (client?.kind) {
      case 'integration':
        return client.family === 'java' ? 'coffee' : 'plug-zap';
      case 'manual':
        return 'wrench';
      case 'browser':
        return 'globe';
      case 'script':
        return 'terminal';
      default:
        return 'shield-question';
    }
  }

  /** «Aplicación Java 17.0.20» / «Postman 7.51» */
  clientText(client: AccountingBnClient | null | undefined): string {
    return client ? [client.label, client.version].filter(Boolean).join(' ') : 'Sin información';
  }

  /**
   * Tipo de origen para el color: system = el propio sistema (descarga automática, sin IP ni cliente externo),
   * authorized = origen autorizado (Recaudación), unknown = IP desconocida, unverified = IP sin verificar.
   */
  originKind(row: AccountingBnTransaction): 'system' | 'authorized' | 'unknown' | 'unverified' {
    if (row.client?.family === 'sync') {
      return 'system';
    }

    if (row.ip_status === 'allowed') {
      return 'authorized';
    }

    return row.ip_status === 'unknown' ? 'unknown' : 'unverified';
  }

  originName(row: AccountingBnTransaction): string {
    switch (this.originKind(row)) {
      case 'system':
        return 'Descarga automática';
      case 'authorized':
        return row.origin_label || 'Autorizada';
      case 'unknown':
        return 'IP desconocida';
      default:
        return 'Sin verificar';
    }
  }

  originIcon(row: AccountingBnTransaction): string {
    switch (this.originKind(row)) {
      case 'system':
        return 'refresh-cw';
      case 'authorized':
        return 'shield-check';
      case 'unknown':
        return 'shield-alert';
      default:
        return 'shield-question';
    }
  }

  originSeverity(row: AccountingBnTransaction): 'info' | 'success' | 'warn' | 'secondary' {
    switch (this.originKind(row)) {
      case 'system':
        return 'info';
      case 'authorized':
        return 'success';
      case 'unknown':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  originStatusSeverity(status: AccountingBnIpStatus | null | undefined): Severity {
    if (status === 'allowed') {
      return 'success';
    }

    return status === 'unknown' ? 'warn' : 'secondary';
  }

  originStatusLabel(status: AccountingBnIpStatus | null | undefined): string {
    if (status === 'allowed') {
      return 'Autorizada';
    }

    return status === 'unknown' ? 'Desconocida' : 'Sin verificar';
  }

  // ------------------------------------------------------------------ detalle y archivos

  openDetail(row: AccountingBnTransaction): void {
    this.selected = row;
    this.preview = null;
    this.detailVisible = true;

    if (row.has_local_file) {
      this.previewLoading = true;
      this.accountingBnService.preview(row.id).subscribe({
        next: (response) => {
          this.previewLoading = false;
          if (response.status === STATUS.success && this.selected?.id === row.id) {
            this.preview = response.payload.data;
          }
        },
        error: () => {
          this.previewLoading = false;
        },
      });
    }
  }

  downloadFile(row: AccountingBnTransaction, event?: Event): void {
    event?.stopPropagation();

    if (!row.has_local_file) {
      this.notificationService.warning('Archivo no disponible', 'No hay un archivo guardado para descargar.');
      return;
    }

    this.downloadingId = row.id;
    this.accountingBnService.download(row.id).subscribe({
      next: (blob) => {
        this.downloadingId = null;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.downloadName(row);
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.downloadingId = null;
        this.notificationService.notifyApiData(error);
      },
    });
  }

  copy(text: string | null): void {
    if (text) {
      navigator.clipboard?.writeText(text).then(() => this.notificationService.success('Copiado', 'Huella SHA-256 copiada.'));
    }
  }

  extraPretty(row: AccountingBnTransaction): string {
    return row.extra_data ? JSON.stringify(row.extra_data, null, 2) : '';
  }

  // ------------------------------------------------------------------ utilidades

  formatSize(bytes: number | null | undefined): string {
    if (!bytes) {
      return '0 B';
    }

    return bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
  }

  hourOf(date: string | null | undefined): string {
    const parsed = this.parse(date);

    return parsed ? new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(parsed) : '--:--';
  }

  timeOf(row: AccountingBnTransaction): string {
    return this.hourOf(row.created_at_lima || row.created_at || row.display_date);
  }

  dateTimeOf(date: string | null | undefined): string {
    const parsed = this.parse(date);

    return parsed
      ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(parsed)
      : 'No registrada';
  }

  basename(path: string): string {
    return path.split('/').pop() || path;
  }

  private buildFilters(): AccountingBnFilter {
    const start = this.dateRange?.[0];
    const end = this.dateRange?.[1] ?? start;

    return {
      start_date: start ? this.isoDate(start) : undefined,
      end_date: end ? this.isoDate(end) : undefined,
      operation: this.operation,
      ip_status: this.origin,
      view: this.view === 'all' ? undefined : this.view,
      search: this.search.trim(),
      page: this.page,
      per_page: this.perPage,
    };
  }

  private buildGroups(items: AccountingBnTransaction[]): DayGroup[] {
    const groups: DayGroup[] = [];
    const formatter = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    for (const item of items) {
      const date = this.parse(item.created_at_lima || item.created_at || item.display_date);
      const key = date ? this.isoDate(date) : 'sin-fecha';
      let group = groups.find((entry) => entry.key === key);

      if (!group) {
        group = { key, label: date ? formatter.format(date) : 'Sin fecha', items: [] };
        groups.push(group);
      }

      group.items.push(item);
    }

    return groups;
  }

  private downloadName(row: AccountingBnTransaction): string {
    if (row.file_path) {
      return this.basename(row.file_path);
    }

    const type = (row.file_type ?? '').trim().toLowerCase();

    return row.file_name && type ? `${row.file_name}.${type}` : row.file_name || `bn-transaction-${row.id}`;
  }

  private isoDate(date: Date): string {
    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
  }

  private parse(raw: string | null | undefined): Date | null {
    if (!raw) {
      return null;
    }

    const date = new Date(raw.replace(' ', 'T'));

    return Number.isNaN(date.getTime()) ? null : date;
  }
}
