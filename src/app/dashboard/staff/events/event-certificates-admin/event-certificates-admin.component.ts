import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Checkbox } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { NOTIFICATION_MESSAGE } from '../../../../core/constants/app-messages.constants';
import { NotificationService } from '../../../../services/notification.service';
import {
  EventCertificateService,
  EventCertificateZipJob,
  EventCertificateSummary
} from '../../../../services/event-certificate.service';

@Component({
  selector: 'app-event-certificates-admin',
  imports: [
    ButtonDirective,
    CardModule,
    Checkbox,
    DatePipe,
    FormsModule,
    NgForOf,
    NgIf,
    ProgressBarModule,
    TableModule,
    TagModule,
    ToolbarModule,
  ],
  templateUrl: './event-certificates-admin.component.html',
  styleUrl: './event-certificates-admin.component.css'
})
export class EventCertificatesAdminComponent implements OnInit, OnDestroy {
  summary?: EventCertificateSummary;
  loading = false;
  downloading = false;
  previewing = false;
  requireEventPercentage = false;
  zipJob?: EventCertificateZipJob;
  zipMessage?: string;
  private pollTimeout?: number;

  constructor(
    private certificateService: EventCertificateService,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.clearPolling();
  }

  loadSummary(): void {
    this.loading = true;
    this.certificateService.summary(this.requireEventPercentage).subscribe({
      next: response => {
        this.loading = false;
        if (response.status === STATUS.success) {
          this.summary = response.payload.data;
          return;
        }

        this.notificationService.notifyApiData(response);
      },
      error: error => {
        this.loading = false;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(error);
      }
    });
  }

  downloadZip(): void {
    this.downloading = true;
    this.zipMessage = 'Preparando generacion...';
    this.clearPolling();

    this.certificateService.prepareZip(this.requireEventPercentage).subscribe({
      next: response => {
        if (response.status !== STATUS.success) {
          this.downloading = false;
          this.zipMessage = undefined;
          this.notificationService.notifyApiData(response);
          return;
        }

        this.handleZipJob(response.payload.data);
      },
      error: error => {
        this.downloading = false;
        this.zipMessage = undefined;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(error);
      }
    });
  }

  previewCertificate(): void {
    this.previewing = true;

    this.certificateService.preview(this.requireEventPercentage).subscribe({
      next: async blob => {
        this.previewing = false;

        try {
          const parsed = JSON.parse(await blob.text());
          this.notificationService.warning(
            parsed?.payload?.title ?? 'No se pudo generar la vista previa',
            parsed?.payload?.message ?? 'Revise los datos del evento.'
          );
          return;
        } catch {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          window.setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        }
      },
      error: error => {
        this.previewing = false;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(error);
      }
    });
  }

  private handleZipJob(job: EventCertificateZipJob): void {
    this.zipJob = job;
    this.zipMessage = this.buildZipMessage(job);

    if (job.status === 'ready') {
      this.downloadPreparedZip(job.job_key);
      return;
    }

    if (job.status === 'failed') {
      this.downloading = false;
      this.notificationService.warning(
        'No se pudo generar el ZIP',
        job.message ?? 'Revise los datos del evento.'
      );
      return;
    }

    this.pollTimeout = window.setTimeout(() => this.pollZipStatus(job.job_key), 3000);
  }

  private pollZipStatus(jobKey: string): void {
    this.certificateService.zipStatus(jobKey).subscribe({
      next: response => {
        if (response.status !== STATUS.success) {
          this.downloading = false;
          this.zipMessage = undefined;
          this.notificationService.notifyApiData(response);
          return;
        }

        this.handleZipJob(response.payload.data);
      },
      error: error => {
        this.downloading = false;
        this.zipMessage = undefined;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(error);
      }
    });
  }

  private downloadPreparedZip(jobKey: string): void {
    this.zipMessage = 'Descargando ZIP listo...';

    this.certificateService.downloadPreparedZip(jobKey).subscribe({
      next: async blob => {
        this.downloading = false;
        this.zipMessage = undefined;

        try {
          const parsed = JSON.parse(await blob.text());
          this.notificationService.warning(
            parsed?.payload?.title ?? 'No se pudo descargar el ZIP',
            parsed?.payload?.message ?? 'Revise el estado de la generacion.'
          );
          return;
        } catch {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          const slug = this.summary?.event.slug ?? 'evento';
          a.href = url;
          a.download = `certificados_${slug}.zip`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: error => {
        this.downloading = false;
        this.zipMessage = undefined;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(error);
      }
    });
  }

  private buildZipMessage(job: EventCertificateZipJob): string {
    if (job.status === 'running' && job.total) {
      const processed = job.processed ?? 0;
      const percentage = Math.round((processed / job.total) * 100);
      return `Generando certificados: ${processed} de ${job.total} (${percentage}%)`;
    }

    if (job.status === 'queued') {
      return 'Generacion de certificados en cola...';
    }

    return job.message ?? 'Preparando generacion de certificados...';
  }

  get zipProgress(): number {
    if (!this.zipJob?.total) {
      return 0;
    }

    return Math.round(((this.zipJob.processed ?? 0) / this.zipJob.total) * 100);
  }

  private clearPolling(): void {
    if (this.pollTimeout) {
      window.clearTimeout(this.pollTimeout);
      this.pollTimeout = undefined;
    }
  }

  displayName(participant: { full_name?: string | null; number: string }): string {
    return participant.full_name?.trim() || `Participante ${participant.number}`;
  }
}
