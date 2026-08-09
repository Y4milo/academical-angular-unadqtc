import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { NotificationService } from '../../../../services/notification.service';
import {
  AccountingBnFilter,
  AccountingBnListResponse,
  AccountingBnService,
  AccountingBnSummary,
  AccountingBnTransaction,
} from '../../../../services/accounting-bn.service';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-bn-incidents',
  imports: [
    ButtonModule,
    CardModule,
    DatePicker,
    FormsModule,
    InputTextModule,
    NgIf,
    ProgressSpinnerModule,
    Select,
    TableModule,
    TagModule,
  ],
  templateUrl: './bn-incidents.component.html',
  styleUrl: './bn-incidents.component.css'
})
export class BnIncidentsComponent implements OnInit {
  readonly today = new Date();
  readonly operationOptions: SelectOption[] = [
    { label: 'Todas', value: '' },
    { label: 'Subida ING', value: 'upload' },
    { label: 'Pagos', value: 'payments' },
    { label: 'Validacion REP', value: 'process-result' },
    { label: 'Duplicados DUP', value: 'duplicate' },
  ];
  readonly statusOptions: SelectOption[] = [
    { label: 'Todos', value: '' },
    { label: 'Exitosos', value: 'success' },
    { label: 'Incidencias', value: 'error' },
  ];
  readonly fileTypeOptions: SelectOption[] = [
    { label: 'Todos', value: '' },
    { label: 'ING', value: 'ING' },
    { label: 'PAGOS', value: 'PAGOS' },
    { label: 'REP', value: 'REP' },
    { label: 'DUP', value: 'DUP' },
  ];

  dateRange: Date[] = [];
  operation = '';
  status = 'error';
  fileType = '';
  search = '';
  page = 1;
  perPage = 20;
  loading = false;
  summaryLoading = false;
  downloadingId: number | null = null;
  summary: AccountingBnSummary | null = null;
  list: AccountingBnListResponse = {
    items: [],
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
      from: null,
      to: null,
    },
  };

  constructor(
    private accountingBnService: AccountingBnService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(page = 1): void {
    this.page = page;
    const filters = this.buildFilters();

    this.summaryLoading = true;
    this.accountingBnService.summary(filters).subscribe({
      next: (response) => {
        this.summaryLoading = false;
        if (response.status === STATUS.success) {
          this.summary = response.payload.data;
        } else {
          this.notificationService.notifyApiData(response);
        }
      },
      error: () => {
        this.summaryLoading = false;
        this.notificationService.error('Error', 'No se pudo cargar el resumen del Banco Nacion.');
      }
    });

    this.loading = true;
    this.accountingBnService.transactions(filters).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === STATUS.success) {
          this.list = response.payload.data;
        } else {
          this.notificationService.notifyApiData(response);
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Error', 'No se pudo cargar el historial del Banco Nacion.');
      }
    });
  }

  clearFilters(): void {
    this.dateRange = [];
    this.operation = '';
    this.status = 'error';
    this.fileType = '';
    this.search = '';
    this.loadData(1);
  }

  onPageChange(event: { first?: number; rows?: number }): void {
    this.perPage = event.rows ?? this.perPage;
    const first = event.first ?? 0;
    const nextPage = Math.floor(first / this.perPage) + 1;
    this.loadData(nextPage);
  }

  getSeverity(status: string | null | undefined): 'success' | 'danger' | 'secondary' {
    if (status === 'success') {
      return 'success';
    }

    if (status === 'error') {
      return 'danger';
    }

    return 'secondary';
  }

  getFileSeverity(fileType: string | null | undefined): 'success' | 'info' | 'warn' | 'secondary' {
    const normalized = this.normalizeFileType(fileType);

    if (normalized === 'ING') {
      return 'success';
    }

    if (normalized === 'PAGOS') {
      return 'info';
    }

    if (normalized === 'REP') {
      return 'warn';
    }

    return 'secondary';
  }

  getFileType(transaction: AccountingBnTransaction): string {
    return this.normalizeFileType(transaction.file_type) || '-';
  }

  getFileBasename(path: string): string {
    return path.split('/').pop() || path;
  }

  downloadFile(transaction: AccountingBnTransaction): void {
    if (!transaction.has_local_file) {
      this.notificationService.warning('Archivo no disponible', 'No hay un archivo local para descargar.');
      return;
    }

    this.downloadingId = transaction.id;
    this.accountingBnService.download(transaction.id).subscribe({
      next: (blob) => {
        this.downloadingId = null;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.getDownloadName(transaction);
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.downloadingId = null;
        this.notificationService.notifyApiData(error);
      }
    });
  }

  getExtraData(transaction: AccountingBnTransaction): string {
    return transaction.extra_data
      ? JSON.stringify(transaction.extra_data)
      : '';
  }

  getSecondaryDate(transaction: AccountingBnTransaction): string {
    if (transaction.request_date && !transaction.request_date.endsWith('00:00:00')) {
      return `Solicitado: ${transaction.request_date}`;
    }

    if (transaction.created_at_lima) {
      return `Registrado Lima: ${transaction.created_at_lima}`;
    }

    return 'Sin fecha solicitada';
  }

  private buildFilters(): AccountingBnFilter {
    const range = this.getSelectedDateRange();

    return {
      start_date: range.startDate,
      end_date: range.endDate,
      operation: this.operation,
      status: this.status,
      file_type: this.fileType,
      search: this.search,
      page: this.page,
      per_page: this.perPage,
    };
  }

  private getSelectedDateRange(): { startDate?: string; endDate?: string } {
    const start = this.dateRange?.[0];
    const end = this.dateRange?.[1] ?? start;

    return {
      startDate: start ? this.formatDate(start) : undefined,
      endDate: end ? this.formatDate(end) : undefined,
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private normalizeFileType(fileType: string | null | undefined): string {
    return (fileType ?? '').trim().toUpperCase();
  }

  private getDownloadName(transaction: AccountingBnTransaction): string {
    const pathName = transaction.file_path
      ? this.getFileBasename(transaction.file_path)
      : null;

    if (pathName) {
      return pathName;
    }

    const type = this.normalizeFileType(transaction.file_type).toLowerCase();

    return transaction.file_name && type
      ? `${transaction.file_name}.${type}`
      : transaction.file_name || `bn-transaction-${transaction.id}`;
  }
}
