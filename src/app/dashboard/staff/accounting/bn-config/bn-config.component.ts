import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { NgFor, NgIf } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { ApiData } from '../../../../models/api/api-data.model';
import { NotificationService } from '../../../../services/notification.service';
import {
  AccountingBnConfig,
  AccountingBnConfigLog,
  AccountingBnDetectedIp,
  AccountingBnOrigin,
  AccountingBnSecuritySettings,
  AccountingBnService,
} from '../../../../services/accounting-bn.service';

interface ModeOption {
  label: string;
  value: boolean;
}

@Component({
  selector: 'app-bn-config',
  imports: [
    AppLucideIconComponent,
    ButtonModule,
    CardModule,
    DialogModule,
    FormsModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    NgFor,
    NgIf,
    SelectButtonModule,
    SkeletonModule,
    TagModule,
    ToggleSwitchModule,
  ],
  templateUrl: './bn-config.component.html',
  styleUrl: './bn-config.component.css',
})
export class BnConfigComponent implements OnInit {
  readonly modeOptions: ModeOption[] = [
    { label: 'Solo marcar', value: false },
    { label: 'Bloquear', value: true },
  ];
  readonly actionLabels: Record<string, string> = {
    origin_authorized: 'Origen autorizado',
    origin_updated: 'Origen modificado',
    origin_removed: 'Origen eliminado',
    ip_ignored: 'IP ignorada',
    ignore_removed: 'IP ignorada restaurada',
    mode_changed: 'Modo cambiado',
    security_changed: 'Seguridad modificada',
    ip_blocked: 'IP bloqueada',
    ip_unblocked: 'IP desbloqueada',
  };

  config: AccountingBnConfig | null = null;
  loading = true;
  saving = false;

  dialogVisible = false;
  editing: AccountingBnOrigin | null = null;
  form = { ip_address: '', label: '', notes: '' };
  formError = '';

  security: AccountingBnSecuritySettings | null = null;
  securityError = '';

  deleteTarget: AccountingBnOrigin | null = null;
  blockConfirmVisible = false;

  constructor(
    private accountingBnService: AccountingBnService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.accountingBnService.config().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === STATUS.success) {
          this.config = response.payload.data;
          this.security = { ...response.payload.data.security };
        } else {
          this.notificationService.notifyApiData(response);
        }
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.notifyApiData(error);
      },
    });
  }

  get blocking(): boolean {
    return this.config?.block_unknown_ips ?? false;
  }

  onModeChange(value: boolean): void {
    if (value === this.blocking) {
      return;
    }

    if (value) {
      this.blockConfirmVisible = true;
      return;
    }

    this.run(this.accountingBnService.setMode(false));
  }

  confirmBlock(): void {
    this.blockConfirmVisible = false;
    this.run(this.accountingBnService.setMode(true));
  }

  saveSecurity(): void {
    if (!this.security) {
      return;
    }

    this.securityError = '';

    if (this.security.alert_email_enabled && !this.security.alert_email?.trim()) {
      this.securityError = 'Escribe un correo para activar los avisos por correo.';
      return;
    }

    this.run(this.accountingBnService.updateSecurity({ ...this.security, alert_email: this.security.alert_email?.trim() ?? '' }));
  }

  get securityDirty(): boolean {
    return !!this.security && !!this.config && JSON.stringify(this.security) !== JSON.stringify(this.config.security);
  }

  unblock(ip: { id: number; ip_address: string }): void {
    this.run(this.accountingBnService.removeOrigin(ip.id));
  }

  openAdd(ip = ''): void {
    this.editing = null;
    this.form = { ip_address: ip, label: '', notes: '' };
    this.formError = '';
    this.dialogVisible = true;
  }

  openEdit(origin: AccountingBnOrigin): void {
    this.editing = origin;
    this.form = { ip_address: origin.ip_address, label: origin.label ?? '', notes: origin.notes ?? '' };
    this.formError = '';
    this.dialogVisible = true;
  }

  save(): void {
    const ip = this.form.ip_address.trim();

    if (!this.editing && !ip) {
      this.formError = 'Escribe la IP del origen.';
      return;
    }

    this.formError = '';
    const request = this.editing
      ? this.accountingBnService.updateOrigin(this.editing.id, { label: this.form.label.trim() || null, notes: this.form.notes.trim() || null })
      : this.accountingBnService.addOrigin({ ip_address: ip, label: this.form.label.trim(), notes: this.form.notes.trim() });

    this.run(request, () => (this.dialogVisible = false));
  }

  toggleActive(origin: AccountingBnOrigin, active: boolean): void {
    this.run(this.accountingBnService.updateOrigin(origin.id, { is_active: active }));
  }

  askDelete(origin: AccountingBnOrigin): void {
    this.deleteTarget = origin;
  }

  confirmDelete(): void {
    const target = this.deleteTarget;
    this.deleteTarget = null;

    if (target) {
      this.run(this.accountingBnService.removeOrigin(target.id));
    }
  }

  ignore(ip: AccountingBnDetectedIp): void {
    this.run(this.accountingBnService.ignoreIp(ip.ip_address));
  }

  describe(log: AccountingBnConfigLog): string {
    const label = this.actionLabels[log.action] ?? log.action;

    if (log.action === 'mode_changed') {
      return `${label}: ${log.details?.['value'] ? 'Bloquear' : 'Solo marcar'}`;
    }

    return log.subject ? `${label}: ${log.subject}` : label;
  }

  private run(request: Observable<ApiData<AccountingBnConfig>>, done?: () => void): void {
    this.saving = true;
    request.subscribe({
      next: (response) => {
        this.saving = false;
        if (response.status === STATUS.success) {
          this.config = response.payload.data;
          this.security = { ...response.payload.data.security };
          done?.();
          if (response.payload.title) {
            this.notificationService.success(response.payload.title, '');
          }
        } else {
          this.notificationService.notifyApiData(response);
        }
      },
      error: (error) => {
        this.saving = false;
        this.notificationService.notifyApiData(error);
      },
    });
  }
}
