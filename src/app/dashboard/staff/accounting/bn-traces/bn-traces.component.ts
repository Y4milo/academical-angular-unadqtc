import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { NotificationService } from '../../../../services/notification.service';
import { LoginService } from '../../../../services/login.service';
import { ROLE } from '../../../../core/constants/app-roles.constants';
import {
  AccountingBnService,
  AccountingBnTraceDetail,
  AccountingBnTraceItem,
  AccountingBnTraceList,
} from '../../../../services/accounting-bn.service';

type Severity = 'success' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'app-bn-traces',
  imports: [
    AppLucideIconComponent,
    ButtonModule,
    CardModule,
    DialogModule,
    DrawerModule,
    FormsModule,
    InputTextModule,
    NgClass,
    SelectButtonModule,
    NgFor,
    NgIf,
    SkeletonModule,
    TagModule,
  ],
  templateUrl: './bn-traces.component.html',
  styleUrl: './bn-traces.component.css',
})
export class BnTracesComponent implements OnInit {
  list: AccountingBnTraceList | null = null;
  loading = true;
  search = '';
  typeFilter = 'all';
  readonly typeOptions = [
    { label: 'Todas', value: 'all' },
    { label: 'Predeterminadas', value: 'allowed' },
    { label: 'Desconocidas', value: 'unknown' },
    { label: 'Bloqueadas', value: 'blocked' },
  ];

  detail: AccountingBnTraceDetail | null = null;
  detailVisible = false;
  detailLoading = false;
  saving = false;
  blockConfirm = false;

  constructor(
    private accountingBnService: AccountingBnService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private loginService: LoginService,
  ) {}

  /** Solo el administrador puede bloquear IP; contabilidad solo consulta. */
  get canBlock(): boolean {
    return this.loginService.getUser()?.role?.value === ROLE.admin;
  }

  ngOnInit(): void {
    this.accountingBnService.traces().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === STATUS.success) {
          this.list = response.payload.data;
          const ip = this.route.snapshot.queryParamMap.get('ip');
          if (ip) {
            this.open(ip);
          }
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

  get filtered(): AccountingBnTraceItem[] {
    const term = this.search.trim().toLowerCase();

    return (this.list?.items ?? []).filter(
      (item) =>
        (this.typeFilter === 'all' || item.status === this.typeFilter) &&
        (!term || item.ip_address.includes(term) || (item.label ?? '').toLowerCase().includes(term)),
    );
  }

  /** IP predeterminadas: los orígenes autorizados, con su actividad. Solo informativo. */
  get predefined(): AccountingBnTraceItem[] {
    return (this.list?.items ?? []).filter((item) => item.status === 'allowed');
  }

  countByType(type: string): number {
    return (this.list?.items ?? []).filter((item) => type === 'all' || item.status === type).length;
  }

  open(ip: string): void {
    this.detail = null;
    this.detailVisible = true;
    this.detailLoading = true;
    this.accountingBnService.trace(ip).subscribe({
      next: (response) => {
        this.detailLoading = false;
        if (response.status === STATUS.success) {
          this.detail = response.payload.data;
        } else {
          this.notificationService.notifyApiData(response);
        }
      },
      error: (error) => {
        this.detailLoading = false;
        this.notificationService.notifyApiData(error);
      },
    });
  }

  block(): void {
    const ip = this.detail?.ip_address;
    this.blockConfirm = false;

    if (!ip) {
      return;
    }

    this.saving = true;
    this.accountingBnService.blockIp(ip).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.status === STATUS.success) {
          this.notificationService.success('IP bloqueada', ip);
          this.refresh(ip);
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

  statusLabel(status: string): string {
    switch (status) {
      case 'allowed':
        return 'Autorizada';
      case 'blocked':
        return 'Bloqueada';
      case 'unknown':
        return 'Desconocida';
      default:
        return 'Sin verificar';
    }
  }

  statusSeverity(status: string): Severity {
    switch (status) {
      case 'allowed':
        return 'success';
      case 'blocked':
        return 'danger';
      case 'unknown':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  statusIcon(status: string): string {
    switch (status) {
      case 'allowed':
        return 'shield-check';
      case 'blocked':
        return 'ban';
      case 'unknown':
        return 'shield-alert';
      default:
        return 'shield-question';
    }
  }

  isLimited(until: number | null): boolean {
    return !!until && until * 1000 > Date.now();
  }

  limitedUntilLabel(until: number | null): string {
    return until ? new Date(until * 1000).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  }

  rejectedShare(item: AccountingBnTraceItem): number {
    return item.total ? Math.round((item.rejected / item.total) * 100) : 0;
  }

  private refresh(ip: string): void {
    this.accountingBnService.traces().subscribe((response) => {
      if (response.status === STATUS.success) {
        this.list = response.payload.data;
      }
    });
    this.open(ip);
  }
}
