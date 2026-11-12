import { Component, NgZone, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TimelineModule } from 'primeng/timeline';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { DirectiveDetail, DirectiveFileKind, DirectivesService, SessionEventType, SignatureSheetResponse, SigningSession } from '../../../../services/directives.service';
import { FirmaPeruSignerService } from '../../../../services/firma-peru-signer.service';
import { DirectiveTrackingComponent } from '../directive-tracking/directive-tracking.component';
import { SignatureSheetViewComponent } from '../signature-sheet-view/signature-sheet-view.component';
import { STEP_ROLE } from '../directive-status';
import { documentTypeColor, documentTypeText } from '../document-type';

/** En qué va la firma: nada empezado, abriendo la sesión, esperando al firmador local, confirmando con el servidor o terminada. */
export type SignPhase = 'idle' | 'opening' | 'waiting' | 'confirming' | 'done';

/** Largo del motivo del rechazo, igual que en el servidor. */
export const REASON_MIN = 10;
export const REASON_MAX = 1000;

const CONFIRM_TRIES = 10;
const CONFIRM_EVERY_MS = 3000;
const REFUSAL_TRIES = 5;
const REFUSAL_EVERY_MS = 1500;

/**
 * La firma de una directiva por la persona a la que le toca. El servidor abre la sesión en el firmador y esta página llama al firmador local de
 * Firma Perú con lo que recibe; el firmador no ve por sí mismo que la persona cerró la ventana o que se acabó el tiempo, así que esta página se lo
 * avisa (cancelar, tiempo agotado y error son obligatorios). La firma en sí la confirma el firmador al servidor, y la página la espera unos segundos.
 */
@Component({
  selector: 'app-directive-sign',
  imports: [FormsModule, PrimeTemplate, BreadcrumbModule, ButtonModule, CardModule, CheckboxModule, DialogModule, MessageModule, SelectButtonModule, SkeletonModule, TagModule, TextareaModule, TimelineModule, DirectiveTrackingComponent, SignatureSheetViewComponent],
  templateUrl: './directive-sign.component.html',
  styleUrl: './directive-sign.component.css',
})
export class DirectiveSignComponent implements OnInit, OnDestroy {
  readonly directive = signal<DirectiveDetail | null>(null);
  /** El cajón del seguimiento (botón «Seguimiento» de la cabecera). */
  readonly trackingOpen = signal(false);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly phase = signal<SignPhase>('idle');
  readonly session = signal<SigningSession | null>(null);
  readonly signError = signal('');
  readonly notice = signal('');
  readonly kind = signal<DirectiveFileKind>('directive');
  readonly previewUrl = signal<SafeResourceUrl | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal('');
  readonly confirmed = signal(false);

  /** El diálogo «Confirmar firma»: la hoja dibujada con lo que entrega el firmador (vista referencial) antes de abrir Firma Perú. */
  readonly confirmOpen = signal(false);
  readonly sheet = signal<SignatureSheetResponse | null>(null);
  readonly sheetLoading = signal(false);
  readonly sheetError = signal(false);

  readonly rejectOpen = signal(false);
  readonly rejectReason = signal('');
  readonly rejectAck = signal(false);
  readonly rejectSending = signal(false);
  readonly rejectError = signal('');
  readonly rejectedDone = signal(false);
  readonly reasonMax = REASON_MAX;
  readonly reasonTooShort = computed(() => this.rejectReason().length > 0 && this.rejectReason().trim().length < REASON_MIN);
  readonly canReject = computed(() => this.rejectReason().trim().length >= REASON_MIN && this.rejectAck() && !this.rejectSending());

  readonly kindOptions: { label: string; value: DirectiveFileKind }[] = [
    { label: 'Documento', value: 'directive' },
    { label: 'Resolución', value: 'resolution' },
  ];
  readonly environment = signal<{ browser: string; recommended: boolean; windows: boolean }>({ browser: '', recommended: true, windows: true });
  readonly before = computed(() => (this.directive()?.progress ?? []).filter(step => step.state === 'signed'));
  readonly position = computed(() => {
    const steps = (this.directive()?.progress ?? []).filter(step => step.state !== 'skipped');
    const index = steps.findIndex(step => step.state === 'active');

    return { number: index + 1, total: steps.length };
  });
  /** Si el firmador rechazó la firma que se acaba de hacer, con el motivo que dio; nulo mientras no se sepa. */
  readonly refusal = signal<{ reason: string } | null>(null);
  readonly myRole = computed(() => {
    const role = this.directive()?.my_step?.role;

    return role ? STEP_ROLE[role] : null;
  });
  readonly busy = computed(() => this.phase() === 'opening' || this.phase() === 'waiting' || this.phase() === 'confirming');
  readonly documentTypeColor = documentTypeColor;
  readonly documentTypeText = documentTypeText;
  /** La lista de comprobación de «Tu firma»: el turno, el navegador y el firmador de Firma Perú, cada uno con su estado. */
  readonly checklist = computed<{ key: string; number: number; state: 'ok' | 'warn' | 'now' | 'wait'; title: string; hint: string; testId: string | null }[]>(() => {
    const current = this.directive();
    const environment = this.environment();
    const phase = this.phase();
    const compatible = environment.recommended && environment.windows;
    const signer: { state: 'now' | 'wait'; hint: string; testId: string | null } =
      phase === 'waiting' ? { state: 'now', hint: 'Elige tu certificado en la ventana de Firma Perú y escribe tu PIN.', testId: 'status-waiting' }
      : phase === 'confirming' ? { state: 'now', hint: 'Confirmando tu firma con el firmador…', testId: 'status-confirming' }
      : phase === 'opening' ? { state: 'now', hint: 'Abriendo la sesión de firma…', testId: null }
      : { state: 'wait', hint: 'Ábrelo antes de firmar; usarás tu DNIe y tu PIN.', testId: null };

    return [
      { key: 'turn', number: 1, state: current?.can_sign ? 'ok' : 'warn', title: 'Es tu turno', hint: `Paso ${this.position().number} de ${this.position().total} · ${current?.active_office ?? ''}`, testId: null },
      { key: 'browser', number: 2, state: compatible ? 'ok' : 'warn', title: 'Navegador compatible', hint: compatible ? 'Microsoft Edge en Windows' : `Estás en ${environment.browser}. Para firmar usa Microsoft Edge en Windows, con el firmador de Firma Perú abierto.`, testId: compatible ? null : 'environment-warning' },
      { key: 'signer', number: 3, title: 'Firma Perú abierto', ...signer },
    ];
  });

  /** Las migas: la lista, el documento y esta pantalla. */
  crumbs(current: DirectiveDetail): MenuItem[] {
    return [
      { label: 'Documentos de gestión', command: () => this.backToList() },
      { label: current.title, command: () => this.back() },
      { label: 'Firmar' },
    ];
  }

  private seq = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private poll: ReturnType<typeof setTimeout> | null = null;
  private objectUrls: string[] = [];
  private destroyed = false;

  constructor(
    private service: DirectivesService,
    private signer: FirmaPeruSignerService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  private get id(): number {
    return Number(this.activatedRoute.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.environment.set(this.signer.environment());
    this.load();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    // Quien sale de la página con la sesión abierta la deja sin terminar: se le avisa al firmador para no dejarla abandonada.
    if (this.phase() === 'waiting') this.report('cancelled', 'La persona salió de la página');
    this.clearTimers();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.service.detail(this.id).subscribe({
      next: response => {
        this.loading.set(false);
        if (response.status !== STATUS.success) {
          this.loadError.set(response.payload?.message || 'No se pudo consultar el documento.');

          return;
        }
        this.directive.set(response.payload.data);
        if (response.payload.data.can_sign) this.preview('directive');
      },
      error: error => {
        this.loading.set(false);
        this.loadError.set(error?.status === 404 ? 'No encontramos ese documento, o no te corresponde.' : 'No se pudo consultar el documento. Inténtalo nuevamente.');
      },
    });
  }

  /** Muestra uno de los dos PDF junto a la firma, para leerlo antes de firmar. */
  preview(kind: DirectiveFileKind): void {
    this.kind.set(kind);
    this.previewLoading.set(true);
    this.previewError.set('');
    this.previewUrl.set(null);
    this.service.file(this.id, kind).subscribe({
      next: blob => {
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        this.objectUrls.push(url);
        this.previewLoading.set(false);
        if (this.kind() === kind) this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      },
      error: () => {
        this.previewLoading.set(false);
        this.previewError.set('No se pudo abrir el PDF. Inténtalo nuevamente.');
      },
    });
  }

  /** Abre «Confirmar firma» y pide la hoja al servidor; si no se puede dibujar, igual se puede firmar: la vista es solo una ayuda. */
  askSign(): void {
    if (this.busy()) return;
    this.confirmOpen.set(true);
    this.sheet.set(null);
    this.sheetError.set(false);
    this.sheetLoading.set(true);
    this.service.signatureSheet(this.id).subscribe({
      next: response => {
        this.sheetLoading.set(false);
        if (response.status === STATUS.success) this.sheet.set(response.payload.data);
        else this.sheetError.set(true);
      },
      error: () => {
        this.sheetLoading.set(false);
        this.sheetError.set(true);
      },
    });
  }

  closeConfirm(): void {
    this.confirmOpen.set(false);
  }

  /** Confirma desde el diálogo: se cierra y empieza la firma. */
  confirmSign(): void {
    this.confirmOpen.set(false);
    this.sign();
  }

  sign(): void {
    if (this.busy()) return;
    this.phase.set('opening');
    this.signError.set('');
    this.notice.set('');
    this.seq = 0;
    this.refusal.set(null);
    this.refusalsBefore = this.refusalCount(this.directive());

    this.service.openSigningSession(this.id).subscribe({
      next: response => {
        if (response.status !== STATUS.success) {
          this.failToOpen(response.payload?.message);

          return;
        }
        this.session.set(response.payload.data);
        this.phase.set('waiting');
        this.watchTime(response.payload.data.expires_at);
        this.startSigner(response.payload.data);
      },
      error: error => this.failToOpen(error?.error?.payload?.message),
    });
  }

  openReject(): void {
    if (this.busy()) return;
    this.rejectError.set('');
    this.rejectOpen.set(true);
  }

  closeReject(): void {
    if (this.rejectSending()) return;
    this.rejectOpen.set(false);
  }

  /** Rechaza la directiva con el motivo: vuelve a la oficina de origen y a quien rechaza ya no le queda nada pendiente en ella. */
  reject(): void {
    if (!this.canReject()) return;
    this.rejectSending.set(true);
    this.rejectError.set('');

    this.service.reject(this.id, this.rejectReason().trim()).subscribe({
      next: response => {
        this.rejectSending.set(false);
        if (response.status === STATUS.success) {
          this.rejectOpen.set(false);
          this.rejectedDone.set(true);
          this.directive.update(current => (current ? { ...current, can_sign: false, can_reject: false, status: 'returned' } : current));
        } else {
          this.rejectError.set(response.payload?.message || 'No se pudo rechazar el documento.');
        }
      },
      error: error => {
        this.rejectSending.set(false);
        this.rejectError.set(error?.error?.payload?.message || error?.error?.message || 'No se pudo rechazar el documento. Inténtalo nuevamente.');
      },
    });
  }

  back(): void {
    this.router.navigateByUrl(`${PATHS.directives.link}/${this.id}`);
  }

  backToList(): void {
    this.router.navigateByUrl(PATHS.directives.link);
  }

  private failToOpen(message?: string): void {
    this.phase.set('idle');
    this.signError.set(message || 'No se pudo abrir la sesión de firma. Inténtalo nuevamente.');
  }

  private startSigner(session: SigningSession): void {
    this.signer
      .load(session.firmaperu.script_url)
      .then(() => {
        this.signer.start(session.firmaperu.port, session.firmaperu.param, {
          init: () => this.zone.run(() => this.report('started')),
          ok: () => this.zone.run(() => this.onOk()),
          cancel: () => this.zone.run(() => this.onCancel()),
        });
      })
      .catch(() => this.zone.run(() => this.onError('No se pudo iniciar el firmador de Firma Perú. Comprueba que esté instalado y abierto en tu equipo.')));
  }

  /** Avisa al firmador si la persona no termina antes de que venza la sesión. */
  private watchTime(expiresAt: string | null): void {
    if (!expiresAt) return;
    const left = new Date(expiresAt).getTime() - Date.now();
    if (!Number.isFinite(left)) return;
    // Fuera de Angular: un temporizador de minutos no debe mantener la aplicación "ocupada" mientras la persona firma.
    this.timer = this.zone.runOutsideAngular(() => setTimeout(() => this.zone.run(() => this.onTimeout()), Math.max(left, 0)));
  }

  private onOk(): void {
    if (this.phase() !== 'waiting') return;
    this.clearTimers();
    this.report('ok_reported');
    this.phase.set('confirming');
    this.confirm(CONFIRM_TRIES);
  }

  private onCancel(): void {
    if (this.phase() !== 'waiting') return;
    this.clearTimers();
    this.report('cancelled', 'La persona cerró la firma');
    this.phase.set('idle');
    this.notice.set('Cerraste la firma sin terminar. Puedes intentarlo de nuevo cuando quieras.');
    // Firma Perú también avisa «cancelado» cuando firmó en el equipo y el firmador rechazó el archivo (certificado de otra persona): se consulta unos
    // segundos si hubo un rechazo nuevo para decir la causa en lugar de «sin terminar».
    this.checkRefusal(REFUSAL_TRIES);
  }

  private refusalsBefore = 0;

  private refusalCount(directive: DirectiveDetail | null): number {
    return (directive?.events ?? []).filter(event => event.type === 'signature_invalid').length;
  }

  private checkRefusal(triesLeft: number): void {
    if (triesLeft <= 0 || this.destroyed) return;

    this.poll = this.zone.runOutsideAngular(() => setTimeout(() => this.zone.run(() => {
      this.service.detail(this.id).subscribe({
        next: response => {
          if (this.destroyed) return;
          const data = response.status === STATUS.success ? response.payload.data : null;
          const refused = (data?.events ?? []).filter(event => event.type === 'signature_invalid');
          if (data && refused.length > this.refusalsBefore) {
            this.directive.set(data);
            this.notice.set('');
            this.refusal.set({ reason: String(refused[refused.length - 1].data?.['reason'] ?? '') });
          } else {
            this.checkRefusal(triesLeft - 1);
          }
        },
        error: () => this.checkRefusal(triesLeft - 1),
      });
    }), REFUSAL_EVERY_MS));
  }

  private onTimeout(): void {
    if (this.phase() !== 'waiting') return;
    this.report('timeout');
    this.phase.set('idle');
    this.signError.set('Se acabó el tiempo para firmar. Vuelve a intentarlo.');
  }

  private onError(message: string): void {
    if (this.phase() !== 'waiting') return;
    this.clearTimers();
    this.report('error', 'No se pudo iniciar el firmador local');
    this.phase.set('idle');
    this.signError.set(message);
  }

  /** La firma la confirma el firmador al servidor; se consulta unos segundos hasta que la directiva deje de esperar a esta persona. */
  private confirm(triesLeft: number): void {
    this.poll = this.zone.runOutsideAngular(() => setTimeout(() => this.zone.run(() => this.checkConfirmation(triesLeft)), CONFIRM_EVERY_MS));
  }

  private checkConfirmation(triesLeft: number): void {
    this.service.detail(this.id).subscribe({
      next: response => {
        if (this.destroyed) return;
        const data = response.status === STATUS.success ? response.payload.data : null;
        if (data && !data.can_sign) {
          this.directive.set(data);
          this.confirmed.set(true);
          this.phase.set('done');
        } else if (triesLeft > 1) {
          this.confirm(triesLeft - 1);
        } else {
          this.phase.set('done');
        }
      },
      error: () => (triesLeft > 1 ? this.confirm(triesLeft - 1) : this.phase.set('done')),
    });
  }

  private report(type: SessionEventType, detail?: string): void {
    const session = this.session();
    if (!session) return;
    // Un aviso que no llega no debe trabar la pantalla: el firmador cierra por su cuenta la sesión que queda abierta.
    this.service.reportSigningEvent(this.id, session.session_id, ++this.seq, type, detail).subscribe({ error: () => undefined });
  }

  private clearTimers(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.poll) clearTimeout(this.poll);
    this.timer = null;
    this.poll = null;
  }
}
