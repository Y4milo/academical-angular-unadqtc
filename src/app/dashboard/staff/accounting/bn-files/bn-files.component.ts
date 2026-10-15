import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { NotificationService } from '../../../../services/notification.service';
import {
  AccountingBnFileEntry,
  AccountingBnFilesDay,
  AccountingBnFilesMonth,
  AccountingBnFileState,
  AccountingBnService,
} from '../../../../services/accounting-bn.service';

type FileType = 'ING' | 'PAGOS' | 'REP' | 'DUP';

@Component({
  selector: 'app-bn-files',
  imports: [AppLucideIconComponent, ButtonModule, DrawerModule, FormsModule, NgClass, NgFor, NgIf, SkeletonModule, TagModule, ToggleSwitchModule],
  templateUrl: './bn-files.component.html',
  styleUrl: './bn-files.component.css',
})
export class BnFilesComponent implements OnInit {
  readonly types: FileType[] = ['ING', 'PAGOS', 'REP', 'DUP'];

  month: AccountingBnFilesMonth | null = null;
  monthKey = '';
  onlyProblems = false;
  loading = true;

  selected: AccountingBnFilesDay | null = null;
  detailVisible = false;
  detailLoading = false;
  downloadingId: number | null = null;

  constructor(
    private accountingBnService: AccountingBnService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(month?: string): void {
    this.loading = true;
    this.accountingBnService.files(month).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === STATUS.success) {
          this.month = response.payload.data;
          this.monthKey = response.payload.data.month;
        } else {
          this.notificationService.notifyApiData(response);
        }
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.notifyApiData(error);
      },
    });
  }

  shiftMonth(delta: number): void {
    const [year, month] = this.monthKey.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    this.load(`${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`);
  }

  get monthLabel(): string {
    if (!this.monthKey) {
      return '';
    }

    const [year, month] = this.monthKey.split('-').map(Number);

    return new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
  }

  get days(): AccountingBnFilesDay[] {
    const days = this.month?.days ?? [];

    return this.onlyProblems ? days.filter((day) => day.has_problem) : days;
  }

  // ------------------------------------------------------------------ presentación

  dayLabel(day: AccountingBnFilesDay): string {
    const name = day.weekday.slice(0, 3);

    return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${Number(day.date.slice(8))}`;
  }

  stateIcon(state: AccountingBnFileState): string {
    switch (state) {
      case 'downloaded':
      case 'received':
        return 'circle-check';
      case 'waiting':
        return 'clock';
      case 'missing':
        return 'circle-x';
      case 'failed':
        return 'triangle-alert';
      default:
        return 'minus';
    }
  }

  stateText(file: AccountingBnFileEntry): string {
    switch (file.state) {
      case 'downloaded':
        return this.hour(file.downloaded_at);
      case 'received':
        return this.hour(file.published_at);
      case 'waiting':
        return 'Esperando';
      case 'missing':
        return 'No llegó';
      case 'failed':
        return 'Con error';
      case 'no_data':
        return 'Sin registro';
      default:
        return 'No corresponde';
    }
  }

  deliveryText(day: AccountingBnFilesDay): { label: string; css: string } {
    if (day.holiday) {
      return { label: 'Sin archivos', css: 'nu' };
    }

    if (day.pagos_delivered) {
      return { label: 'Pagos entregados', css: 'ok' };
    }

    return day.files['PAGOS']?.state === 'downloaded' ? { label: 'Pagos sin entregar', css: 'wa' } : { label: '—', css: 'nu' };
  }

  rowTag(day: AccountingBnFilesDay): { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' } | null {
    if (day.has_problem) {
      return { label: 'Revisar', severity: 'danger' };
    }

    return day.is_today ? { label: 'Hoy', severity: 'secondary' } : null;
  }

  hour(date: string | null | undefined): string {
    return date ? date.slice(11, 16) : '--:--';
  }

  dateTime(date: string | null | undefined): string {
    return date ? `${date.slice(8, 10)}/${date.slice(5, 7)} ${date.slice(11, 16)}` : '—';
  }

  formatSize(bytes: number | undefined): string {
    if (!bytes) {
      return '0 B';
    }

    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  }

  // ------------------------------------------------------------------ detalle

  open(day: AccountingBnFilesDay): void {
    this.selected = day;
    this.detailVisible = true;
    this.detailLoading = true;
    this.accountingBnService.filesDay(day.date).subscribe({
      next: (response) => {
        this.detailLoading = false;
        if (response.status === STATUS.success && this.selected?.date === day.date) {
          this.selected = response.payload.data;
        }
      },
      error: () => {
        this.detailLoading = false;
      },
    });
  }

  fileList(day: AccountingBnFilesDay): AccountingBnFileEntry[] {
    return this.types.map((type) => day.files[type]).filter(Boolean);
  }

  lifecycle(file: AccountingBnFileEntry): string {
    switch (file.state) {
      case 'downloaded':
        return `Publicado por el banco ${this.hour(file.published_at)} · descargado ${this.hour(file.downloaded_at)}`;
      case 'received':
        return `Recibido de Recaudación ${this.hour(file.published_at)}`;
      case 'waiting':
        return 'Aún dentro del horario de entrega';
      case 'missing':
        return 'No llegó en el horario esperado';
      case 'failed':
        return file.error ? `No se pudo descargar: ${file.error}` : 'No se pudo descargar';
      case 'no_data':
        return 'Sin registro: el día es anterior a la descarga automática y el banco ya no conserva el archivo';
      default:
        return 'Feriado: el banco no genera archivos';
    }
  }

  canDownload(file: AccountingBnFileEntry): boolean {
    return !!file.transaction_id && (file.state === 'downloaded' || file.state === 'received');
  }

  download(file: AccountingBnFileEntry): void {
    if (!file.transaction_id) {
      return;
    }

    this.downloadingId = file.transaction_id;
    this.accountingBnService.download(file.transaction_id).subscribe({
      next: (blob) => {
        this.downloadingId = null;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name || `${file.type.toLowerCase()}-${this.selected?.date}`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.downloadingId = null;
        this.notificationService.notifyApiData(error);
      },
    });
  }
}
