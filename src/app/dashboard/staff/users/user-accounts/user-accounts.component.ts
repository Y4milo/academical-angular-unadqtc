import { Component, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { StatusTagComponent } from '../../../../core/components/status-tag.component';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { AccountKind, AccountRow, HolderState, UserAccountsService } from '../../../../services/user-accounts.service';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/** Días antes del fin de la orden de servicio desde los que se avisa que el titular está por vencer. */
export const HOLDER_EXPIRING_DAYS = 30;

export const KIND_LABELS: Record<AccountKind, string> = { person: 'Persona', functional: 'Funcional', service: 'De servicio' };

/** Cuentas que no son de una persona: las funcionales de una oficina y las de servicio. Solo administrador. */
@Component({
  selector: 'app-user-accounts',
  imports: [DatePipe, RouterLink, ButtonModule, MessageModule, SkeletonModule, TableModule, AppLucideIconComponent, StatusTagComponent],
  templateUrl: './user-accounts.component.html',
  styleUrl: './user-accounts.component.css',
})
export class UserAccountsComponent implements OnInit {
  readonly accounts = signal<AccountRow[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly skeletonRows = Array.from({ length: 4 }, (_, index) => index);

  /** Cuentas funcionales que necesitan atención: sin titular, con la orden de servicio vencida o por vencer. */
  readonly needAttention = computed(() => this.accounts().filter(account => this.holderTag(account)?.attention).length);

  constructor(private service: UserAccountsService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.list().subscribe({
      next: response => {
        this.accounts.set(response.payload.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  sheetLink(account: AccountRow): string[] {
    return ['/', PATHS.admin.path, 'users', 'accounts', String(account.id)];
  }

  /** La fila entera abre la ficha, salvo que el clic sea en un enlace o botón, que ya navegan por su cuenta. */
  openSheet(event: Event, account: AccountRow): void {
    if ((event.target as HTMLElement).closest('a, button')) {
      return;
    }
    this.router.navigate(this.sheetLink(account));
  }

  kindLabel(kind: AccountKind): string {
    return KIND_LABELS[kind];
  }

  kindSeverity(kind: AccountKind): Severity {
    return kind === 'functional' ? 'info' : 'secondary';
  }

  statusSeverity(status: string | null): Severity {
    return status === 'Activo' ? 'success' : 'secondary';
  }

  /** Estado del titular que se muestra en la lista; las cuentas de servicio no tienen titular. */
  holderTag(account: AccountRow): { label: string; severity: Severity; attention: boolean } | null {
    if (account.kind !== 'functional') {
      return null;
    }
    const state: HolderState = account.holder_state ?? 'none';
    if (state === 'none') {
      return { label: 'Sin titular', severity: 'warn', attention: true };
    }
    if (state === 'expired') {
      return { label: 'O/S vencida', severity: 'danger', attention: true };
    }
    if (this.daysLeft(account.holder_valid_to) !== null && (this.daysLeft(account.holder_valid_to) as number) <= HOLDER_EXPIRING_DAYS) {
      return { label: 'Por vencer', severity: 'warn', attention: true };
    }
    return { label: 'Vigente', severity: 'success', attention: false };
  }

  private daysLeft(validTo: string | null): number | null {
    if (!validTo) {
      return null;
    }
    const end = new Date(`${validTo}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((end.getTime() - today.getTime()) / 86_400_000);
  }
}
