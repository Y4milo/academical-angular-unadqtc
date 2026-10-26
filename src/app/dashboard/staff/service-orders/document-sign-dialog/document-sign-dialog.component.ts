import { Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { FormFieldComponent } from '../../../../core/components/form-field.component';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { FirmaPeruSignerService } from '../../../../services/firma-peru-signer.service';
import { NotificationService } from '../../../../services/notification.service';
import { DocumentKind, ServiceOrderDeliverable, ServiceOrdersService, SigningConfig } from '../../../../services/service-orders.service';

type Phase = 'idle' | 'preparing' | 'waiting' | 'done' | 'failed';

const POLL_MS = 2000;
const MAX_POLLS = 120;

/** Firma digital (token o DNIe, con Firma Perú) de la carta o del informe de un entregable. */
@Component({
  selector: 'app-document-sign-dialog',
  imports: [FormsModule, ButtonModule, DialogModule, MessageModule, SelectModule, FormFieldComponent],
  templateUrl: './document-sign-dialog.component.html',
  styleUrl: './document-sign-dialog.component.css',
})
export class DocumentSignDialogComponent implements OnDestroy {
  @Input({ required: true }) deliverable!: ServiceOrderDeliverable;
  @Input({ required: true }) kind!: DocumentKind;
  @Input({ required: true }) signing!: SigningConfig;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** Se firmó: la pantalla debe volver a leer la orden. */
  @Output() signed = new EventEmitter<void>();

  readonly phase = signal<Phase>('idle');
  readonly message = signal('');
  reason = '';
  readonly environment;

  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private signaturesBefore = 0;

  constructor(
    private service: ServiceOrdersService,
    private signer: FirmaPeruSignerService,
    private notificationService: NotificationService,
  ) {
    this.environment = signer.environment();
  }

  get title(): string {
    return this.kind === 'letter' ? 'Firmar la carta' : 'Firmar el informe de conformidad';
  }

  get busy(): boolean {
    return this.phase() === 'preparing' || this.phase() === 'waiting';
  }

  onShow(): void {
    this.phase.set('idle');
    this.message.set('');
    this.reason = this.signing.reasons[0] ?? '';
  }

  close(): void {
    this.stopPolling();
    this.visibleChange.emit(false);
  }

  start(): void {
    if (!this.reason) {
      this.fail('Elige el motivo de la firma.');
      return;
    }
    this.phase.set('preparing');
    this.message.set('');
    this.signaturesBefore = (this.kind === 'letter' ? this.deliverable.letter_signature : this.deliverable.conformity_signature).signers.length;
    this.service.prepareSignature(this.deliverable.id, this.kind, this.reason).subscribe({
      next: response => {
        if (response.status !== STATUS.success) {
          this.phase.set('failed');
          this.notificationService.notifyApiData(response);
          return;
        }
        this.open(response.payload.data.param, response.payload.data.port);
      },
      error: error => {
        this.phase.set('idle');
        this.notificationService.notifyApiData(error);
      },
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private open(param: string, port: number): void {
    this.signer.load(this.signing.script_url)
      .then(() => {
        this.phase.set('waiting');
        this.message.set('Abre tu firmador, elige el certificado, ubica el sello y escribe tu PIN en su ventana.');
        this.signer.start(port, param, {
          ok: () => this.poll(0),
          cancel: () => this.fail('Se canceló la firma.'),
        });
      })
      .catch(() => this.fail('No se pudo cargar el firmador de Firma Perú. Revisa tu conexión a internet.'));
  }

  private poll(count: number): void {
    this.stopPolling();
    this.service.signatureStatus(this.deliverable.id, this.kind).subscribe({
      next: response => {
        const status = response.status === STATUS.success ? response.payload.data : null;
        if (status && status.signers.length > this.signaturesBefore) {
          this.phase.set('done');
          this.message.set('');
          this.signed.emit();
        } else if (status?.last_error) {
          this.fail(status.last_error);
        } else if (count >= MAX_POLLS) {
          this.fail('No llegó el documento firmado. Revisa el firmador e intenta de nuevo.');
        } else {
          this.pollTimer = setTimeout(() => this.poll(count + 1), POLL_MS);
        }
      },
      error: () => {
        this.pollTimer = setTimeout(() => this.poll(count + 1), POLL_MS);
      },
    });
  }

  private fail(message: string): void {
    this.stopPolling();
    this.phase.set('failed');
    this.message.set(message);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
