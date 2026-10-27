import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { StepsModule } from 'primeng/steps';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { AppLucideIconComponent } from '../../../core/components/lucide-icon/lucide-icon.component';
import { FormFieldComponent } from '../../../core/components/form-field.component';
import { STATUS } from '../../../core/constants/api-status.constants';
import { dateToIso, isoToDate } from '../../../core/utils/date-input.util';
import {
  DEFAULT_REVIEW_THRESHOLDS, PhotoReview, REVIEW_GROUPS, ReviewGroup, reviewFace, reviewFile, serializeReview, warningsOf, withHints,
} from '../../../core/utils/photo-review.util';
import { validatePhotoCardStudent } from '../../../helper/helper.util';
import { PhotoFaceService } from '../../../services/photo-face.service';
import { CardFlowState, CardSubmitResult, StudentCardFlowService } from '../../../services/student-card-flow.service';
import { StudentCardService } from '../../../services/student-card.service';
import { StudentService } from '../../../services/student.service';
import { NotificationService } from '../../../services/notification.service';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

const CARD_STATUS: Record<string, { label: string; severity: Severity }> = {
  validated: { label: 'Validado', severity: 'success' },
  pending: { label: 'Pendiente de validación', severity: 'info' },
  flagged: { label: 'Observado', severity: 'warn' },
  unregistered: { label: 'Sin enviar', severity: 'secondary' },
};

/** Carné universitario del estudiante: datos de contacto, DNI solo sin foto previa y foto del carné. */
@Component({
  selector: 'app-student-card-registration',
  imports: [
    DatePipe, FormsModule, AccordionModule, ReactiveFormsModule, ButtonModule, CardModule, CheckboxModule, DatePickerModule, DialogModule, FileUploadModule, ImageModule,
    InputTextModule, MessageModule, SkeletonModule, StepsModule, TagModule, TextareaModule, AppLucideIconComponent, FormFieldComponent,
  ],
  templateUrl: './student-card-registration.component.html',
  styleUrl: './student-card-registration.component.css',
})
export class StudentCardRegistrationComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  readonly maxBirthdate = new Date();

  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly state = signal<CardFlowState | null>(null);
  readonly submitting = signal(false);
  readonly step = signal(0);
  readonly changingPhoto = signal(false);

  /** Revisión previa de la foto elegida (criterios de la SUNEDU): avisa, no bloquea. */
  readonly review = signal<PhotoReview | null>(null);
  readonly reviewing = signal(false);
  readonly suneduConfirmed = signal(false);
  readonly reviewGroups = REVIEW_GROUPS;
  readonly reviewWarnings = computed(() => warningsOf(this.review()?.checks ?? []));
  readonly suneduUrl = 'https://siucarne.sunedu.gob.pe/carne/validacion';
  /** Grupos de la revisión abiertos: los que tienen avisos; los que están bien quedan plegados. */
  readonly openGroups = signal<string[]>([]);
  readonly photoLabel = signal('');
  /** Tras enviar el carné se muestra la pantalla final con lo que sigue. */
  readonly justSubmitted = signal(false);
  readonly submitResult = signal<CardSubmitResult | null>(null);

  /** Vista previa del DNI elegido: imagen con `p-image` o PDF en un diálogo con el visor del navegador. */
  readonly dniImageUrl = signal<string | null>(null);
  readonly dniPdfUrl = signal<SafeResourceUrl | null>(null);
  readonly dniPdfRaw = signal<string | null>(null);
  readonly pdfOpen = signal(false);

  /** Foto actual del estudiante (la aprobada de un semestre anterior o la recién subida). */
  readonly currentPhotoUrl = signal<string | null>(null);
  readonly photoPreviewUrl = signal<string | null>(null);
  readonly dniName = signal<string | null>(null);
  photoError = '';
  dniError = '';
  private photoFile: File | null = null;
  private dniFile: File | null = null;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    cellphone: ['', [Validators.required, Validators.maxLength(20)]],
    birthdate: [null as Date | null, [Validators.required]],
    address: ['', [Validators.required, Validators.maxLength(255)]],
  });

  /** Sin foto previa el flujo tiene tres pasos (datos, DNI, foto); con foto previa es una sola pantalla. */
  readonly longFlow = computed(() => {
    const state = this.state();
    return !!state && !state.photo.has_previous;
  });

  readonly steps = computed(() => (this.state()?.dni.required ? [{ label: 'Datos' }, { label: 'DNI' }, { label: 'Foto' }] : [{ label: 'Datos' }, { label: 'Foto' }]));

  readonly cardStatus = computed(() => {
    const status = this.state()?.card.status ?? 'unregistered';
    return CARD_STATUS[status] ?? { label: status, severity: 'secondary' as Severity };
  });

  constructor(
    private flow: StudentCardFlowService,
    private studentService: StudentService,
    private cardService: StudentCardService,
    private notifications: NotificationService,
    private faceService: PhotoFaceService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.revoke(this.currentPhotoUrl());
    this.revoke(this.photoPreviewUrl());
    this.revoke(this.dniImageUrl());
    this.revoke(this.dniPdfRaw());
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');

    try {
      // El pago del estudiante se guarda en la sesión del servidor; el flujo lo necesita para el envío.
      await firstValueFrom(this.studentService.setPaymentSession());
      const response = await firstValueFrom(this.flow.state());

      if (response.status !== STATUS.success) {
        this.loadError.set(response.payload.message);
        return;
      }

      const state = response.payload.data!;
      this.state.set(state);
      this.form.patchValue({
        email: state.student.email ?? '',
        cellphone: state.student.cellphone ?? '',
        address: state.student.address ?? '',
        birthdate: isoToDate(state.student.birthdate),
      });

      if (state.photo.has_previous || state.photo.uploaded_now) {
        await this.loadCurrentPhoto();
      }
    } catch {
      this.loadError.set('No se pudo cargar tu carné. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadCurrentPhoto(): Promise<void> {
    try {
      const response = await firstValueFrom(this.cardService.downloadFile('photo'));
      if (response.body) {
        this.revoke(this.currentPhotoUrl());
        this.currentPhotoUrl.set(URL.createObjectURL(response.body));
      }
    } catch {
      this.currentPhotoUrl.set(null);
    }
  }

  async onPhotoSelect(event: { files?: File[] }): Promise<void> {
    const file = event.files?.[0];
    if (!file) {
      return;
    }

    const result = await validatePhotoCardStudent(file, this.state()!.rules);
    this.revoke(this.photoPreviewUrl());

    this.review.set(null);
    this.suneduConfirmed.set(false);

    if (!result.validated) {
      this.photoFile = null;
      this.photoPreviewUrl.set(null);
      this.photoError = result.invalid.map(item => item.message).join(' ');
      return;
    }

    this.photoError = '';
    this.photoFile = file;
    this.photoPreviewUrl.set(URL.createObjectURL(file));
    this.photoLabel.set(`${file.name} · ${Math.round(file.size / 102.4) / 10} KB`);
    await this.reviewPhoto(file);
  }

  /** Revisión previa en el dispositivo: archivo y fondo con las reglas del semestre, rostro con MediaPipe. */
  private async reviewPhoto(file: File): Promise<void> {
    const rules = this.state()!.rules;
    const thresholds = rules.photo_review ?? DEFAULT_REVIEW_THRESHOLDS;
    this.reviewing.set(true);

    try {
      const bitmap = await createImageBitmap(file);
      const fileChecks = await reviewFile(file, bitmap, rules, thresholds);
      const points = await this.faceService.detect(bitmap);
      bitmap.close();
      const checks = withHints([...fileChecks, ...reviewFace(points, thresholds)]);
      this.review.set({ checks, face: !!points && points.faces > 0, points: points && points.faces > 0 ? points : null });
      this.openGroups.set(REVIEW_GROUPS.filter(group => warningsOf(checks.filter(check => check.group === group.id)) > 0).map(group => group.id));
    } catch {
      this.review.set(null);
    } finally {
      this.reviewing.set(false);
    }
  }

  onGroups(value: string | number | string[] | number[] | null | undefined): void {
    this.openGroups.set(Array.isArray(value) ? value.map(String) : value == null ? [] : [String(value)]);
  }

  /** Desde la pantalla final: vuelve al flujo para cambiar la foto. */
  editAgain(): void {
    this.justSubmitted.set(false);
    this.submitResult.set(null);

    if (this.state()?.photo.has_previous) {
      this.startChangingPhoto();
    } else {
      this.step.set(this.steps().length - 1);
    }
  }

  checksOf(group: ReviewGroup) {
    return (this.review()?.checks ?? []).filter(check => check.group === group);
  }

  warningsOfGroup(group: ReviewGroup): number {
    return warningsOf(this.checksOf(group));
  }

  onDniSelect(event: { files?: File[] }): void {
    const file = event.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      this.dniError = 'El DNI no debe superar los 20 MB.';
      this.dniFile = null;
      this.dniName.set(null);
      return;
    }

    this.dniError = '';
    this.dniFile = file;
    this.dniName.set(file.name);
    this.revoke(this.dniImageUrl());
    this.revoke(this.dniPdfRaw());
    this.dniImageUrl.set(null);
    this.dniPdfRaw.set(null);
    this.dniPdfUrl.set(null);

    const url = URL.createObjectURL(file);

    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      this.dniPdfRaw.set(url);
      this.dniPdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    } else {
      this.dniImageUrl.set(url);
    }
  }

  startChangingPhoto(): void {
    this.changingPhoto.set(true);
  }

  cancelChangingPhoto(): void {
    this.changingPhoto.set(false);
    this.photoFile = null;
    this.photoError = '';
    this.revoke(this.photoPreviewUrl());
    this.photoPreviewUrl.set(null);
    this.review.set(null);
    this.suneduConfirmed.set(false);
  }

  next(): void {
    if (this.step() === 0 && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.step() === 1 && this.state()?.dni.required && !this.dniFile && !this.state()?.dni.uploaded_now) {
      this.dniError = 'Sube la foto de tu DNI.';
      return;
    }

    this.step.update(step => step + 1);
  }

  back(): void {
    this.step.update(step => Math.max(0, step - 1));
  }

  /** Último paso (foto) del flujo largo, o la única pantalla del flujo corto. */
  get canSubmit(): boolean {
    const state = this.state();
    if (!state) {
      return false;
    }
    const photoReady = !!this.photoFile || state.photo.uploaded_now || state.photo.has_previous;
    // Una foto nueva exige confirmar que la SUNEDU la validó; conservar la anterior no.
    const confirmed = !this.photoFile || this.suneduConfirmed();
    return photoReady && confirmed && !this.reviewing() && !this.submitting();
  }

  async submit(): Promise<void> {
    const state = this.state();
    if (!state) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.step.set(0);
      return;
    }

    if (!this.photoFile && !state.photo.uploaded_now && !state.photo.has_previous) {
      this.photoError = 'Sube la foto del carné.';
      return;
    }

    this.submitting.set(true);

    try {
      const value = this.form.getRawValue();
      const contact = await firstValueFrom(this.flow.saveContact({
        email: value.email ?? '',
        cellphone: value.cellphone ?? '',
        address: value.address ?? '',
        birthdate: dateToIso(value.birthdate),
      }));

      if (contact.status !== STATUS.success) {
        this.notifications.notifyApiData(contact);
        return;
      }

      if (this.dniFile && state.dni.required && !(await this.upload('dni', this.dniFile))) {
        return;
      }

      if (this.photoFile && !(await this.upload('photo', this.photoFile))) {
        return;
      }

      const result = await firstValueFrom(this.flow.submit());
      this.notifications.notifyApiData(result);

      if (result.status === STATUS.success) {
        this.submitResult.set(result.payload.data ?? null);
        this.justSubmitted.set(true);
        this.dniFile = null;
        this.photoFile = null;
        this.review.set(null);
        this.suneduConfirmed.set(false);
        this.changingPhoto.set(false);
        await this.load();
      }
    } catch {
      this.notifications.error('No se pudo enviar', 'Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }

  private async upload(type: 'dni' | 'photo', file: File): Promise<boolean> {
    const form = new FormData();
    form.append(type, file);

    if (type === 'photo') {
      form.append('sunedu_confirmed', '1');
      const review = this.review();
      if (review) {
        form.append('client_review', serializeReview(review));
      }
    }

    const response = await firstValueFrom(type === 'dni' ? this.cardService.uploadDniPhoto(form) : this.cardService.uploadCardPhoto(form));

    if (response.status !== STATUS.success) {
      this.notifications.notifyApiData(response);
      return false;
    }

    return true;
  }

  private revoke(url: string | null): void {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
