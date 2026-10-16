import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { DBU_STATUS_LABELS, DbuPublicAppointment, DbuPublicService, dbuErrorMessage } from './dbu-public.service';

/** Consulta y cancelación de una cita de Bienestar con su código y el número de documento. Sin cuenta. */
@Component({
  selector: 'app-dbu-status',
  standalone: true,
  imports: [FormsModule, RouterLink, ButtonModule, CardModule, InputTextModule, MessageModule, TagModule],
  templateUrl: './dbu-status.component.html',
  styleUrl: './dbu-booking.component.css',
})
export class DbuStatusComponent {
  code = '';
  documentNumber = '';

  readonly busy = signal(false);
  readonly error = signal('');
  readonly appointment = signal<DbuPublicAppointment | null>(null);
  readonly confirmingCancel = signal(false);

  constructor(private service: DbuPublicService) {}

  canSearch(): boolean {
    return !this.busy() && /^CT-[A-Za-z0-9]{6}$/i.test(this.code.trim()) && this.documentNumber.trim().length >= 6;
  }

  search(): void {
    if (!this.canSearch()) {
      return;
    }
    this.run(this.service.status(this.payload()), 'No encontramos la cita. Revisa tu código y tu documento.');
  }

  askCancel(): void {
    this.confirmingCancel.set(true);
  }

  keep(): void {
    this.confirmingCancel.set(false);
  }

  cancel(): void {
    if (this.busy()) {
      return;
    }
    this.confirmingCancel.set(false);
    this.run(this.service.cancel(this.payload()), 'No se pudo cancelar la cita.');
  }

  newSearch(): void {
    this.appointment.set(null);
    this.error.set('');
    this.confirmingCancel.set(false);
  }

  label(status: string): string {
    return DBU_STATUS_LABELS[status] ?? status;
  }

  severity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    if (status === 'reserved' || status === 'attended') {
      return 'success';
    }
    if (status === 'pending') {
      return 'warn';
    }
    return status === 'no_show' ? 'danger' : 'secondary';
  }

  prettyDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(year, month - 1, day));
  }

  private payload(): { code: string; document_number: string } {
    return { code: this.code.trim().toUpperCase(), document_number: this.documentNumber.trim() };
  }

  private run(call: ReturnType<DbuPublicService['status']>, fallback: string): void {
    this.busy.set(true);
    this.error.set('');
    call.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: response => this.appointment.set(response.payload.data),
      error: error => this.error.set(dbuErrorMessage(error, fallback)),
    });
  }
}
