import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { FormFieldComponent } from '../../../../core/components/form-field.component';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { NotificationService } from '../../../../services/notification.service';
import { ServiceOrdersConfig, ServiceOrdersService, SignatureKind } from '../../../../services/service-orders.service';

interface SettingField {
  key: string;
  label: string;
  hint?: string;
}

const PEOPLE: SettingField[] = [
  { key: 'president_name', label: 'Presidente de la Comisión Organizadora', hint: 'Destinatario de la carta.' },
  { key: 'oti_name', label: 'Jefe de la Oficina de Tecnologías de la Información' },
  { key: 'oti_title', label: 'Cargo del jefe de la oficina' },
  { key: 'dga_name', label: 'Director de Administración', hint: 'Destinatario del informe de conformidad.' },
  { key: 'dga_title', label: 'Cargo del director de Administración' },
];

const SUFFIXES: SettingField[] = [
  { key: 'letter_suffix', label: 'Sufijo de la carta', hint: 'Sale en "CARTA N°007-YAPL-SI". Separa las dos partes con guion.' },
  { key: 'report_suffix', label: 'Sufijo del informe', hint: 'Sale en "INFORME N°169-2026-UNADQTC/PCO-OTI".' },
];

/** Autoridades y numeración de las cartas e informes de conformidad. */
@Component({
  selector: 'app-service-orders-config',
  imports: [FormsModule, ButtonModule, InputNumberModule, InputTextModule, MessageModule, SkeletonModule, FormFieldComponent],
  templateUrl: './service-orders-config.component.html',
  styleUrl: './service-orders-config.component.css',
})
export class ServiceOrdersConfigComponent implements OnInit, OnDestroy {
  readonly people = PEOPLE;
  readonly suffixes = SUFFIXES;
  readonly images: { kind: SignatureKind; label: string }[] = [
    { kind: 'signature', label: 'Firma' },
    { kind: 'fingerprint', label: 'Huella digital' },
  ];
  /** Vista previa de lo subido (URL temporal del navegador, por eso se libera al cambiar o salir). */
  readonly previews = signal<Partial<Record<SignatureKind, string>>>({});
  readonly uploading = signal<SignatureKind | null>(null);

  readonly config = signal<ServiceOrdersConfig | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);

  settings: Record<string, string> = {};
  /** Último número usado: el siguiente que se asigna es este más uno. */
  lastLetter = 0;
  lastReport = 0;

  constructor(
    private service: ServiceOrdersService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.config().subscribe({
      next: response => {
        this.loading.set(false);
        if (response.status === STATUS.success) {
          this.apply(response.payload.data);
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

  ngOnDestroy(): void {
    Object.values(this.previews()).forEach(url => URL.revokeObjectURL(url));
  }

  hasImage(kind: SignatureKind): boolean {
    const config = this.config();
    return !!config && (kind === 'signature' ? config.has_signature : config.has_fingerprint);
  }

  upload(kind: SignatureKind, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.uploading.set(kind);
    this.service.uploadSignatureImage(kind, file).subscribe({
      next: response => {
        this.uploading.set(null);
        if (response.status === STATUS.success) {
          this.config.set(response.payload.data);
          this.loadPreview(kind);
          this.notificationService.success('Imagen guardada', 'La podrás incluir al emitir una carta.');
        } else {
          this.notificationService.notifyApiData(response);
        }
      },
      error: error => {
        this.uploading.set(null);
        this.notificationService.notifyApiData(error);
      },
    });
  }

  remove(kind: SignatureKind): void {
    this.uploading.set(kind);
    this.service.deleteSignatureImage(kind).subscribe({
      next: response => {
        this.uploading.set(null);
        if (response.status === STATUS.success) {
          this.config.set(response.payload.data);
          this.setPreview(kind, null);
        } else {
          this.notificationService.notifyApiData(response);
        }
      },
      error: error => {
        this.uploading.set(null);
        this.notificationService.notifyApiData(error);
      },
    });
  }

  save(): void {
    const config = this.config();
    if (!config) {
      return;
    }
    this.saving.set(true);
    this.service.updateConfig({
      settings: this.settings,
      sequences: [
        { kind: 'letter', year: config.year, last_number: this.lastLetter },
        { kind: 'report', year: config.year, last_number: this.lastReport },
      ],
    }).subscribe({
      next: response => {
        this.saving.set(false);
        if (response.status === STATUS.success) {
          this.apply(response.payload.data);
          this.notificationService.success('Configuración guardada', 'Los próximos documentos usarán estos datos.');
        } else {
          this.notificationService.notifyApiData(response);
        }
      },
      error: error => {
        this.saving.set(false);
        this.notificationService.notifyApiData(error);
      },
    });
  }

  private apply(config: ServiceOrdersConfig): void {
    this.config.set(config);
    this.settings = { ...config.settings };
    this.lastLetter = config.next_letter_number - 1;
    this.lastReport = config.next_report_number - 1;
    this.images.filter(image => this.hasImage(image.kind) && !this.previews()[image.kind]).forEach(image => this.loadPreview(image.kind));
  }

  private loadPreview(kind: SignatureKind): void {
    this.service.signatureImage(kind).subscribe({
      next: blob => this.setPreview(kind, URL.createObjectURL(blob)),
      error: () => this.setPreview(kind, null),
    });
  }

  private setPreview(kind: SignatureKind, url: string | null): void {
    const current = this.previews()[kind];
    if (current) {
      URL.revokeObjectURL(current);
    }
    this.previews.update(previews => ({ ...previews, [kind]: url ?? undefined }));
  }
}
