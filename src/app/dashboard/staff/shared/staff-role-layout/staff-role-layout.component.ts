import {Component, computed, inject, input, OnInit, signal} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MenuItem} from 'primeng/api';
import {filter, map, startWith} from 'rxjs';
import {Avatar} from 'primeng/avatar';
import {ButtonModule} from 'primeng/button';
import {Drawer} from 'primeng/drawer';
import {Message} from 'primeng/message';
import {PanelMenu} from 'primeng/panelmenu';
import {Skeleton} from 'primeng/skeleton';
import {PATHS} from '../../../../core/constants/app-paths.constants';
import {AppLucideIconComponent} from '../../../../core/components/lucide-icon/lucide-icon.component';
import {LoginService} from '../../../../services/login.service';
import {NotificationService} from '../../../../services/notification.service';
import {UsersService} from '../../../../services/users.service';
import {StaffChangePasswordDialogComponent} from '../staff-change-password-dialog/staff-change-password-dialog.component';
import {StaffMenuStore} from '../staff-menu/staff-menu.store';
import {buildStaffMenu, initialsOf} from '../staff-menu/staff-menu.util';

@Component({
  selector: 'app-staff-role-layout',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    Avatar,
    ButtonModule,
    Drawer,
    Message,
    PanelMenu,
    Skeleton,
    AppLucideIconComponent,
    StaffChangePasswordDialogComponent,
  ],
  templateUrl: './staff-role-layout.component.html',
  styleUrl: './staff-role-layout.component.css'
})
export class StaffRoleLayoutComponent implements OnInit {
  readonly attendanceRouterLink = input('');
  readonly loadRemoteMenu = input(true);

  private readonly menuStore = inject(StaffMenuStore);
  private readonly usersService = inject(UsersService);
  private readonly notificationService = inject(NotificationService);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    {initialValue: this.router.url},
  );

  readonly status = this.menuStore.status;
  /** PrimeNG writes `expanded` into the model it is given, so the sidebar and the drawer each get their own copy. */
  readonly sidebarItems = computed(() => this.menuFor());
  readonly drawerItems = computed(() => this.menuFor());
  readonly drawerOpen = signal(false);
  readonly showChangePasswordDialog = signal(false);
  readonly loggingOut = signal(false);
  readonly skeletonRows = [1, 2, 3, 4, 5];

  get userName(): string {
    return this.loginService.getUser()?.staff?.names ?? '';
  }

  get userPosition(): string {
    return this.loginService.getUser()?.position?.label ?? '';
  }

  get userInitials(): string {
    return initialsOf(this.userName);
  }

  private menuFor(): MenuItem[] {
    return buildStaffMenu(this.loadRemoteMenu() ? this.menuStore.groups() : [], this.currentUrl());
  }

  ngOnInit(): void {
    if (this.loadRemoteMenu()) {
      this.menuStore.load();
    }
  }

  retryMenu(): void {
    this.menuStore.load(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  openChangePasswordDialog(): void {
    this.drawerOpen.set(false);
    this.showChangePasswordDialog.set(true);
  }

  logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);

    this.usersService.logoutStaff().subscribe({
      next: (response) => {
        this.finishLogout();
        this.notificationService.notifyApiData(response);
      },
      error: (e) => {
        this.finishLogout();
        this.notificationService.notifyApiData(e);
      }
    });
  }

  private finishLogout(): void {
    this.loggingOut.set(false);
    this.loginService.removeUser();
    this.menuStore.clear();
    this.router.navigate([PATHS.login.staff]);
  }
}
