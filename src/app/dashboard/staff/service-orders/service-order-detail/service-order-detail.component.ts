import { Component, OnInit, computed, signal } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { DocumentSignDialogComponent } from '../document-sign-dialog/document-sign-dialog.component';
import { ApiData } from '../../../../models/api/api-data.model';
import { FormFieldComponent } from '../../../../core/components/form-field.component';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { NotificationService } from '../../../../services/notification.service';
import {
  DeliverableStatus, DocumentFormat, DocumentKind, DocumentSignature, ServiceOrder, ServiceOrderDeliverable, ServiceOrdersConfig,
  ServiceOrdersService, fromIsoDate, toIsoDate,
} from '../../../../services/service-orders.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'secondary';

const ORDINALS = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo', 'Undécimo', 'Duodécimo'];
const STATUS_LABELS: Record<DeliverableStatus, { label: string; severity: TagSeverity }> = {
  locked: { label: 'Bloqueado', severity: 'secondary' },
  pending_letter: { label: 'Falta la carta', severity: 'warn' },
  pending_conformity: { label: 'Falta la conformidad', severity: 'info' },
  finished: { label: 'Finalizado', severity: 'success' },
};
/** Una fila de documento dentro del entregable: la carta o el informe de conformidad. */
interface DocRow {
  kind: DocumentKind;
  icon: string;
  title: string;
  meta: string;
  issued: boolean;
  signed: boolean;
  tag: { label: string; severity: TagSeverity } | null;
  /** Si el documento todavía no existe, el paso que lo emite. */
  emit: DocumentKind | null;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Una orden de servicio y sus entregables: carta, conformidad y descarga en Word o PDF. */
@Component({
  selector: 'app-service-order-detail',
  imports: [
    FormsModule, RouterLink, ButtonModule, CheckboxModule, DatePickerModule, DialogModule, InputNumberModule, InputTextModule, MenuModule, MessageModule,
    SkeletonModule, TagModule, TextareaModule, TooltipModule, FormFieldComponent, DocumentSignDialogComponent,
  ],
  templateUrl: './service-order-detail.component.html',
  styleUrl: './service-order-detail.component.css',
})
export class ServiceOrderDetailComponent implements OnInit {
  readonly order = signal<ServiceOrder | null>(null);
  readonly config = signal<ServiceOrdersConfig | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly downloading = signal<string | null>(null);

  /** Documentos de cada entregable, con su estado y su firma ya resumidos para mostrar. */
  readonly docs = computed<Record<number, DocRow[]>>(() => {
    const result: Record<number, DocRow[]> = {};
    for (const d of this.order()?.deliverables ?? []) {
      const rows: DocRow[] = [];
      const canSign = this.canSign;
      if (d.letter_number) {
        const signed = d.letter_signature.signed;
        rows.push({
          kind: 'letter', icon: 'pi-file', title: this.letterTitle(d), issued: true, signed, emit: null,
          meta: `${this.shortDate(d.letter_date)}${d.letter_signed ? ' · con firma y huella' : ''}${this.signedText(d.letter_signature)}`,
          tag: canSign ? (signed ? { label: 'Firmada', severity: 'success' } : { label: 'Sin firmar', severity: 'warn' }) : null,
        });
      } else if (d.status === 'pending_letter') {
        rows.push({ kind: 'letter', icon: 'pi-file', title: 'Carta', issued: false, signed: false, emit: 'letter', meta: 'Aún no se emite.', tag: null });
      }
      if (d.status === 'finished') {
        const signed = d.conformity_signature.signed;
        rows.push({
          kind: 'conformity', icon: 'pi-file-check', title: `Informe N°${d.report_number}-${d.report_year}`, issued: true, signed, emit: null,
          meta: `Acta ${d.record_number}-${d.record_year} · ${this.shortDate(d.conformity_date)}${this.signedText(d.conformity_signature)}`,
          tag: canSign ? (signed ? { label: 'Firmado', severity: 'success' } : { label: 'Sin firmar', severity: 'warn' }) : null,
        });
      } else if (d.status === 'pending_conformity') {
        rows.push({ kind: 'conformity', icon: 'pi-file-check', title: 'Informe de conformidad', issued: false, signed: false, emit: 'conformity', meta: 'Se emite con el N° de acta de conformidad.', tag: null });
      }
      result[d.id] = rows;
    }
    return result;
  });

  /** Menús de descarga y de más acciones de cada documento, armados una sola vez por cambio de datos. */
  readonly menus = computed<Record<string, MenuItem[]>>(() => {
    const result: Record<string, MenuItem[]> = {};
    const canSign = this.canSign;
    for (const d of this.order()?.deliverables ?? []) {
      for (const kind of ['letter', 'conformity'] as DocumentKind[]) {
        const signed = this.signatureOf(d, kind).signed;
        result[`${d.id}-${kind}-download`] = [
          { label: 'Word', icon: 'pi pi-file-word', command: () => this.download(d, kind, 'docx') },
          { label: signed ? 'PDF firmado' : 'PDF', icon: 'pi pi-file-pdf', command: () => this.download(d, kind, 'pdf') },
        ];
        result[`${d.id}-${kind}-more`] = canSign ? [{ label: 'Agregar otra firma', icon: 'pi pi-pencil', command: () => this.openSign(d, kind) }] : [];
      }
    }
    return result;
  });

  letterDialog = false;
  letterTarget: ServiceOrderDeliverable | null = null;
  letterForm: { date: Date | null; number: number | null; activity: string; signed: boolean } = { date: null, number: null, activity: '', signed: false };
  letterError = '';

  signDialog = false;
  signTarget: ServiceOrderDeliverable | null = null;
  signKind: DocumentKind = 'letter';

  conformityDialog = false;
  conformityTarget: ServiceOrderDeliverable | null = null;
  conformityForm = this.emptyConformity();
  conformityError = '';

  constructor(
    private service: ServiceOrdersService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    this.loadError.set(false);
    this.service.show(id).subscribe({
      next: response => {
        this.loading.set(false);
        if (response.status === STATUS.success) {
          this.order.set(response.payload.data);
          this.loadConfig();
        } else {
          this.loadError.set(true);
          this.notificationService.notifyApiData(response);
        }
      },
      error: error => {
        this.loading.set(false);
        this.loadError.set(true);
        this.notificationService.notifyApiData(error);
      },
    });
  }

  back(): void {
    this.router.navigateByUrl(PATHS.admin.serviceOrders.link);
  }

  ordinal(deliverable: ServiceOrderDeliverable): string {
    return ORDINALS[deliverable.position - 1] ?? `${deliverable.position}.º`;
  }

  statusOf(deliverable: ServiceOrderDeliverable) {
    return STATUS_LABELS[deliverable.status];
  }

  /** "lunes 31/08/2026" */
  dayText(iso: string | null): string {
    const date = fromIsoDate(iso);
    return date ? `${WEEKDAYS[date.getDay()]} ${this.shortDate(iso)}` : '';
  }

  shortDate(iso: string | null): string {
    return iso ? iso.split('-').reverse().join('/') : '';
  }

  /** La firma o la huella ya subidas en la configuración; sin ellas no hay nada que incluir. */
  get hasSignatureImages(): boolean {
    const config = this.config();
    return !!config && (config.has_signature || config.has_fingerprint);
  }

  readonly configLink = `/${PATHS.admin.serviceOrders.link}/config`;

  signatureOf(deliverable: ServiceOrderDeliverable, kind: DocumentKind): DocumentSignature {
    return kind === 'letter' ? deliverable.letter_signature : deliverable.conformity_signature;
  }

  get canSign(): boolean {
    return !!this.config()?.signing?.configured;
  }

  /** " · Firmó Fulano el 26/10/2026 16:02": quién y cuándo, sin el tipo de certificado ni el DNI. */
  private signedText(signature: DocumentSignature): string {
    const signers = signature.signers;
    if (signers.length === 0) {
      return '';
    }
    const last = signers[signers.length - 1];
    const when = new Date(last.signed_at);
    const stamp = `${String(when.getDate()).padStart(2, '0')}/${String(when.getMonth() + 1).padStart(2, '0')}/${when.getFullYear()} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
    const name = last.name.replace(/\s+(FIR|FAU)\b.*$/, '');
    const note = signers.some(signer => signer.holder_matches === false) ? ' (titular distinto del esperado)' : '';
    return signers.length === 1 ? ` · Firmó ${name} el ${stamp}${note}` : ` · Firmado por ${signers.length} personas, la última el ${stamp}${note}`;
  }

  openSign(deliverable: ServiceOrderDeliverable, kind: DocumentKind): void {
    this.signTarget = deliverable;
    this.signKind = kind;
    this.signDialog = true;
  }

  afterSigned(): void {
    this.load();
  }

  letterTitle(deliverable: ServiceOrderDeliverable): string {
    return `Carta N°${String(deliverable.letter_number ?? '').padStart(3, '0')}-${deliverable.letter_year}`;
  }

  openLetter(deliverable: ServiceOrderDeliverable): void {
    this.letterTarget = deliverable;
    this.letterForm = { date: fromIsoDate(deliverable.suggested_letter_date), number: null, activity: deliverable.activity ?? '', signed: this.hasSignatureImages };
    this.letterError = '';
    this.letterDialog = true;
  }

  saveLetter(): void {
    const target = this.letterTarget;
    if (!target) {
      return;
    }
    if (!this.letterForm.date) {
      this.letterError = 'Elige la fecha de la carta.';
      return;
    }
    this.saving.set(true);
    this.service.issueLetter(target.id, {
      letter_date: toIsoDate(this.letterForm.date),
      letter_number: this.letterForm.number,
      activity: this.letterForm.activity.trim() || null,
      include_signature: this.letterForm.signed && this.hasSignatureImages,
    }).subscribe({
      next: response => this.afterSave(response, () => (this.letterDialog = false)),
      error: error => this.failSave(error),
    });
  }

  openConformity(deliverable: ServiceOrderDeliverable): void {
    this.conformityTarget = deliverable;
    const today = new Date();
    this.conformityForm = {
      conformityDate: today, reportDate: today, reportNumber: null, recordNumber: '', recordYear: today.getFullYear(),
      penalty: '-', delayDays: '-', observation: deliverable.suggested_observation,
    };
    this.conformityError = '';
    this.conformityDialog = true;
  }

  saveConformity(): void {
    const target = this.conformityTarget;
    const form = this.conformityForm;
    if (!target) {
      return;
    }
    if (!form.recordNumber.trim()) {
      this.conformityError = 'Escribe el número de acta de conformidad.';
      return;
    }
    if (!form.conformityDate || !form.reportDate) {
      this.conformityError = 'Elige la fecha de la conformidad y la del informe.';
      return;
    }
    this.saving.set(true);
    this.service.issueConformity(target.id, {
      conformity_date: toIsoDate(form.conformityDate),
      report_date: toIsoDate(form.reportDate),
      report_number: form.reportNumber,
      record_number: form.recordNumber.trim(),
      record_year: form.recordYear,
      penalty: form.penalty.trim() || '-',
      delay_days: form.delayDays.trim() || '-',
      observation: form.observation.trim() || '-',
    }).subscribe({
      next: response => this.afterSave(response, () => (this.conformityDialog = false)),
      error: error => this.failSave(error),
    });
  }

  download(deliverable: ServiceOrderDeliverable, kind: DocumentKind, format: DocumentFormat): void {
    const key = `${deliverable.id}-${kind}-${format}`;
    this.downloading.set(key);
    this.service.download(deliverable.id, kind, format).subscribe({
      next: response => {
        this.downloading.set(null);
        this.save(response, `${kind}-${deliverable.id}.${format}`);
      },
      error: async error => {
        this.downloading.set(null);
        this.notificationService.error('No se pudo descargar', await this.messageOf(error));
      },
    });
  }

  private loadConfig(): void {
    this.service.config().subscribe({
      next: response => {
        if (response.status === STATUS.success) {
          this.config.set(response.payload.data);
        }
      },
    });
  }

  private afterSave(response: ApiData<ServiceOrder>, close: () => void): void {
    this.saving.set(false);
    if (response.status === STATUS.success) {
      this.order.set(response.payload.data);
      this.loadConfig();
      close();
    } else {
      this.notificationService.notifyApiData(response);
    }
  }

  private failSave(error: HttpErrorResponse): void {
    this.saving.set(false);
    this.notificationService.notifyApiData(error);
  }

  private save(response: HttpResponse<Blob>, fallbackName: string): void {
    const blob = response.body;
    if (!blob) {
      return;
    }
    if (blob.type.includes('json')) {
      blob.text().then(text => {
        let message = 'El documento no se pudo generar.';
        try {
          message = JSON.parse(text)?.payload?.message ?? message;
        } catch { /* se usa el texto por defecto */ }
        this.notificationService.error('No se pudo generar el documento', message);
      });
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.fileNameOf(response) ?? fallbackName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private fileNameOf(response: HttpResponse<Blob>): string | null {
    const header = response.headers.get('content-disposition') ?? '';
    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
    if (encoded) {
      return decodeURIComponent(encoded[1]);
    }
    return /filename="([^"]+)"/i.exec(header)?.[1] ?? null;
  }

  private async messageOf(error: { error?: unknown }): Promise<string> {
    const body = error?.error;
    if (body instanceof Blob) {
      try {
        return JSON.parse(await body.text())?.payload?.message ?? 'Intenta de nuevo.';
      } catch {
        return 'Intenta de nuevo.';
      }
    }
    return 'Intenta de nuevo.';
  }

  private emptyConformity() {
    return {
      conformityDate: null as Date | null,
      reportDate: null as Date | null,
      reportNumber: null as number | null,
      recordNumber: '',
      recordYear: null as number | null,
      penalty: '-',
      delayDays: '-',
      observation: '-',
    };
  }
}
