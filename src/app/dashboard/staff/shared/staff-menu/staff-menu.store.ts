import {Injectable, inject, signal} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {LoginService} from '../../../../services/login.service';
import {UsersService} from '../../../../services/users.service';

export type StaffMenuStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Menu of the signed-in staff user, loaded once per session instead of once per layout. */
@Injectable({providedIn: 'root'})
export class StaffMenuStore {
  private readonly usersService = inject(UsersService);
  private readonly loginService = inject(LoginService);
  private loadedFor: string | null = null;

  readonly groups = signal<MenuItem[]>([]);
  readonly status = signal<StaffMenuStatus>('idle');

  load(force = false): void {
    const userId = this.loginService.getUser()?.id ?? null;

    if (this.status() === 'loading' || (!force && this.status() === 'ready' && this.loadedFor === userId)) {
      return;
    }

    this.status.set('loading');
    this.usersService.getStaffMenu().subscribe({
      next: (response) => {
        this.groups.set(response.payload.data ?? []);
        this.loadedFor = userId;
        this.status.set('ready');
      },
      error: () => {
        this.groups.set([]);
        this.status.set('error');
      },
    });
  }

  clear(): void {
    this.groups.set([]);
    this.loadedFor = null;
    this.status.set('idle');
  }
}
