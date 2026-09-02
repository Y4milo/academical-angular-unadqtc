import {CommonModule} from '@angular/common';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {MessageModule} from 'primeng/message';
import {Select} from 'primeng/select';
import {TooltipModule} from 'primeng/tooltip';
import {StepsModule} from 'primeng/steps';
import {MenuItem} from 'primeng/api';
import {AvailableChannel, SupportRequestService, SupportRequestSubmission} from '../services/support-request.service';
import {TestModeBannerComponent} from '../core/components/test-mode-banner.component';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-public-support-request', standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, InputTextModule, MessageModule, Select, TooltipModule, StepsModule, TestModeBannerComponent],
  templateUrl: './public-support-request.component.html', styleUrl: './public-support-request.component.css',
})
export class PublicSupportRequestComponent implements OnInit, OnDestroy {
  readonly steps: MenuItem[] = [
    {label: 'Identificación'}, {label: 'Solicitud'}, {label: 'Contacto'}, {label: 'Confirmación'},
  ];
  activeStep = 0;
  stepError: number | null = null;
  identityValidated = false;
  availableChannels: AvailableChannel[] = [];
  themeMode: 'light' | 'dark' = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  private readonly deviceTheme = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly deviceThemeChanged = (event: MediaQueryListEvent): void => {
    this.themeMode = event.matches ? 'dark' : 'light';
    this.applyTheme();
  };
  requesterOptions = [
    {label: 'Estudiante', value: 'student'}, {label: 'Docente', value: 'professor'},
    {label: 'Personal administrativo', value: 'administrative'}, {label: 'No puedo determinarlo', value: 'unknown'},
    {label: 'Ya no tengo vínculo vigente', value: 'former_member'},
  ];
  requestOptions = [
    {label: 'Conocer o recuperar mi correo institucional', value: 'recover_email'},
    {label: 'Restablecer contraseña', value: 'reset_password'}, {label: 'Crear correo institucional', value: 'create_email'},
    {label: 'Reactivar una cuenta', value: 'reactivate_email'}, {label: 'Problema con verificación en dos pasos', value: 'mfa_problem'},
    {label: 'Otro problema', value: 'other'},
  ];
  form: SupportRequestSubmission = {
    requester_type: 'student', request_type: 'recover_email', document_number: '', student_code: '',
    contact_channel: 'email', contact_value: '', new_personal_email: '', description: '',
  };
  saving = false; error = ''; ticket = ''; status = ''; verificationRequired = false; code = ''; resultEmail = '';
  responseMessage = ''; wasDuplicate = false;
  testMode = false;
  institutionalDomains: string[] = [];
  constructor(private service: SupportRequestService, private route: ActivatedRoute) {
    this.applyTheme();
    this.deviceTheme.addEventListener('change', this.deviceThemeChanged);
  }

  ngOnInit(): void {
    this.service.configuration().subscribe({next: response => {
      this.testMode = response.payload.data.test_mode;
      this.institutionalDomains = response.payload.data.institutional_domains ?? [];
    }});
    const ticket = this.route.snapshot.queryParamMap.get('ticket');
    const verification = this.route.snapshot.queryParamMap.get('verification');
    if (ticket && verification) {
      this.ticket = ticket; this.activeStep = 3; this.saving = true;
      this.verifyValue(verification);
    }
  }

  toggleTheme(): void {
    this.themeMode = this.themeMode === 'dark' ? 'light' : 'dark';
    this.applyTheme();
  }

  ngOnDestroy(): void {
    this.deviceTheme.removeEventListener('change', this.deviceThemeChanged);
  }

  submit(): void {
    this.error = '';
    if (!this.form.document_number.trim() || !this.form.contact_value.trim() || (this.form.requester_type === 'student' && !this.form.student_code?.trim())) {
      this.error = 'Complete los datos obligatorios.'; this.stepError = 2; return;
    }
    if (this.form.contact_channel === 'email' && this.isInstitutionalEmail(this.form.contact_value)) {
      this.error = 'Ingrese un correo personal, no su correo institucional.'; this.stepError = 2; return;
    }
    if (this.form.contact_channel === 'phone' && (!this.form.new_personal_email?.trim() || !this.isValidEmail(this.form.new_personal_email) || this.isInstitutionalEmail(this.form.new_personal_email))) {
      this.error = 'Ingrese un nuevo correo personal válido que no pertenezca al dominio institucional.'; this.stepError = 2; return;
    }
    this.stepError = null;
    this.saving = true;
    this.service.submit(this.form).subscribe({
      next: response => {
        this.saving = false; const data = response.payload.data; this.ticket = data.ticket_number;
        this.status = data.status; this.verificationRequired = data.requires_verification;
        this.responseMessage = response.payload.message; this.wasDuplicate = !!data.was_duplicate;
        this.activeStep = 3;
      },
      error: error => { this.saving = false; this.stepError = 2; this.error = error?.error?.payload?.message ?? error?.error?.message ?? 'No se pudo registrar la solicitud.'; },
    });
  }

  validateIdentity(): void {
    this.error = '';
    if (!this.form.document_number.trim() || (this.form.requester_type === 'student' && !this.form.student_code?.trim())) {
      this.error = 'Complete los datos de identificación.'; this.stepError = 0; return;
    }
    this.saving = true;
    this.service.availableChannels(this.form).subscribe({
      next: response => {
        this.saving = false;
        const result = response.payload.data;
        if (!result.identity_found) {
          this.error = 'No se encontró una persona que coincida con los datos ingresados.'; this.stepError = 0; return;
        }
        if (!result.channels.length) {
          this.error = 'No existe un correo personal ni celular válido registrado. El caso debe ser atendido por un administrador.'; this.stepError = 0; return;
        }
        this.identityValidated = true;
        this.availableChannels = result.channels.map(channel => ({...channel, label: `${channel.label} (${channel.masked})`}));
        this.form.contact_channel = this.availableChannels[0].value;
        this.form.contact_value = '';
        this.stepError = null;
        this.activeStep = 1;
      },
      error: error => { this.saving = false; this.stepError = 0; this.error = error?.error?.payload?.message ?? error?.error?.message ?? 'No fue posible validar la identificación.'; },
    });
  }

  goToContact(): void {
    this.error = '';
    if (!this.form.request_type) { this.error = 'Seleccione el tipo de atención.'; this.stepError = 1; return; }
    this.stepError = null;
    this.activeStep = 2;
  }

  backToIdentity(): void {
    this.activeStep = 0; this.identityValidated = false; this.availableChannels = []; this.error = ''; this.stepError = null;
  }

  verify(): void {
    if (!/^\d{6}$/.test(this.code)) { this.error = 'Ingrese el código de seis dígitos.'; return; }
    this.saving = true; this.error = ''; this.verifyValue(this.code);
  }

  private verifyValue(value: string): void {
    this.service.verify(this.ticket, value).subscribe({
      next: response => {
        this.saving = false; this.verificationRequired = false; this.status = response.payload.data.status;
        this.resultEmail = response.payload.data.institutional_email ?? '';
      },
      error: error => { this.saving = false; this.error = error?.error?.payload?.message ?? 'Código inválido.'; },
    });
  }

  reset(): void {
    this.ticket = ''; this.status = ''; this.code = ''; this.error = ''; this.resultEmail = ''; this.verificationRequired = false;
    this.responseMessage = ''; this.wasDuplicate = false;
    this.activeStep = 0; this.identityValidated = false; this.availableChannels = [];
    this.stepError = null;
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('app-dark', this.themeMode === 'dark');
  }

  private isInstitutionalEmail(value: string): boolean {
    const domain = value.trim().toLowerCase().split('@').pop() ?? '';
    return this.institutionalDomains.some(item => domain === item || domain.endsWith(`.${item}`));
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }
}
