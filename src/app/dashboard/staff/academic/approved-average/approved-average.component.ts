import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { NotificationService } from '../../../../services/notification.service';
import { ApprovedAverageService } from '../../../../services/approved-average.service';
import { ApprovedAveragePreview, ApprovedAveragePreviewRow } from '../../../../models/student/approved-average-preview.model';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { NOTIFICATION_MESSAGE } from '../../../../core/constants/app-messages.constants';

@Component({
  selector: 'app-approved-average',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeModule,
    ButtonModule,
    CardModule,
    Select,
    TableModule,
    TagModule,
    ToolbarModule,
  ],
  templateUrl: './approved-average.component.html',
  styleUrl: './approved-average.component.css'
})
export class ApprovedAverageComponent {
  selectedFile?: File;
  selectedCampus = '';
  preview?: ApprovedAveragePreview;
  isPreviewLoading = false;
  isDownloading = false;

  campusOptions = [
    { label: 'Todas las sedes', value: '' },
    { label: 'Cusco', value: 'CUSCO' },
    { label: 'Calca', value: 'CALCA' },
    { label: 'Checacupe', value: 'CHECACUPE' },
  ];

  constructor(
    private approvedAverageService: ApprovedAverageService,
    private notificationService: NotificationService,
  ) { }

  get rows(): ApprovedAveragePreviewRow[] {
    return this.preview?.rows ?? [];
  }

  get includedCount(): number {
    return this.rows.filter(row => row.included).length;
  }

  get observedCount(): number {
    return this.rows.filter(row => !row.included).length;
  }

  get multiCampusCount(): number {
    return this.rows.filter(row => row.status === 'EN_VARIAS_SEDES_MISMA_CARRERA').length;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!this.isTxtFile(file)) {
      this.notificationService.warning('Archivo invalido', 'Seleccione un archivo TXT con codigos o DNI de estudiantes.');
      return;
    }

    this.selectedFile = file;
    this.preview = undefined;
    this.generatePreview();
  }

  generatePreview(): void {
    if (!this.selectedFile) {
      this.notificationService.warning('Sin archivo', 'Seleccione un TXT antes de generar la vista previa.');
      return;
    }

    this.isPreviewLoading = true;
    this.approvedAverageService.preview(this.selectedFile, this.selectedCampus).subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          this.preview = data.payload.data;
          return;
        }

        this.notificationService.notifyApiData(data);
      },
      error: e => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.isPreviewLoading = false;
      }
    });
  }

  downloadExcel(): void {
    if (!this.selectedFile) {
      this.notificationService.warning('Sin archivo', 'Seleccione un TXT antes de descargar.');
      return;
    }

    this.isDownloading = true;
    this.approvedAverageService.export(this.selectedFile, this.selectedCampus).subscribe({
      next: async response => {
        const blob = response.body;

        if (!blob) {
          this.notificationService.warning('Sin archivo', 'No se recibio el Excel procesado.');
          return;
        }

        if (blob.type.includes('json') || blob.type.includes('text')) {
          await this.notifyBlobApiWarning(blob);
          return;
        }

        this.saveBlob(response, blob);
      },
      error: e => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.isDownloading = false;
      }
    });
  }

  getStatusSeverity(row: ApprovedAveragePreviewRow): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (row.status === 'OK') {
      return 'success';
    }

    if (row.status === 'EN_VARIAS_SEDES_MISMA_CARRERA') {
      return 'info';
    }

    if (row.status === 'SIN_NOTAS_APROBADAS') {
      return 'warn';
    }

    if (row.status === 'NO_ENCONTRADO' || row.status === 'VARIAS_CARRERAS') {
      return 'danger';
    }

    return 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      OK: 'OK',
      EN_VARIAS_SEDES_MISMA_CARRERA: 'Varias sedes, misma carrera',
      VARIAS_CARRERAS: 'Varias carreras',
      SIN_NOTAS_APROBADAS: 'Sin notas aprobadas',
      NO_ENCONTRADO: 'No encontrado',
    };

    return labels[status] ?? status;
  }

  private isTxtFile(file: File): boolean {
    return file.type === 'text/plain' || /\.txt$/i.test(file.name);
  }

  private saveBlob(response: HttpResponse<Blob>, blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.getDownloadFileName(response, 'promedio_notas_aprobadas.xls');
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  private getDownloadFileName(response: HttpResponse<Blob>, fallback: string): string {
    const headerFileName = response.headers.get('X-File-Name')
      || this.getContentDispositionFileName(response.headers.get('Content-Disposition'));

    return headerFileName || fallback;
  }

  private getContentDispositionFileName(contentDisposition: string | null): string | null {
    if (!contentDisposition) {
      return null;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1].replace(/"/g, ''));
    }

    const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return asciiMatch?.[1] ?? null;
  }

  private async notifyBlobApiWarning(blob: Blob): Promise<void> {
    try {
      const parsed = JSON.parse(await blob.text());
      this.notificationService.notifyApiData(parsed);
    } catch {
      this.notificationService.warning('Respuesta invalida', 'El servicio no devolvio un archivo Excel valido.');
    }
  }
}
