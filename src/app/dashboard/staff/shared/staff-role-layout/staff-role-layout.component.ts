import {Component, Input, OnInit} from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import {MenuItem} from 'primeng/api';
import {Menubar} from 'primeng/menubar';
import {PATHS} from '../../../../core/constants/app-paths.constants';
import {LoginService} from '../../../../services/login.service';
import {NotificationService} from '../../../../services/notification.service';
import {UsersService} from '../../../../services/users.service';
import {AppLucideIconComponent} from '../../../../core/components/lucide-icon/lucide-icon.component';
import {
  buildStaffAccountMenu,
  buildStaffAttendanceMenu,
  prependStaffCommonMenu
} from '../staff-account-menu/staff-account-menu.util';
import {
  StaffChangePasswordDialogComponent
} from '../staff-change-password-dialog/staff-change-password-dialog.component';

@Component({
  selector: 'app-staff-role-layout',
  imports: [
    Menubar,
    RouterLink,
    RouterOutlet,
    AppLucideIconComponent,
    StaffChangePasswordDialogComponent,
  ],
  templateUrl: './staff-role-layout.component.html',
  styleUrl: './staff-role-layout.component.css'
})
export class StaffRoleLayoutComponent implements OnInit {
  @Input() attendanceRouterLink = '';
  @Input() loadRemoteMenu = true;

  items: MenuItem[] = [];
  showChangePasswordDialog = false;
  loggingOut = false;

  constructor(
    private usersService: UsersService,
    private notificationService: NotificationService,
    private loginService: LoginService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.items = this.withSharedMenu([]);

    if (!this.loadRemoteMenu) {
      return;
    }

    this.usersService.getStaffMenu().subscribe({
      next: (response) => {
        this.items = this.withSharedMenu(response.payload.data ?? []);
      },
      error: () => {
        this.items = this.withSharedMenu([]);
      }
    });
  }

  onMenuItemClick(event: Event, item: MenuItem): void {
    if (item.command) {
      event.preventDefault();
      item.command({ originalEvent: event, item });
    }
  }

  openChangePasswordDialog(): void {
    this.showChangePasswordDialog = true;
  }

  logout(): void {
    if (this.loggingOut) {
      return;
    }

    this.loggingOut = true;

    this.usersService.logoutStaff().subscribe({
      next: (response) => {
        this.loggingOut = false;
        this.loginService.removeUser();
        this.notificationService.notifyApiData(response);
        this.router.navigate([PATHS.login.staff]);
      },
      error: (e) => {
        this.loggingOut = false;
        this.loginService.removeUser();
        this.notificationService.notifyApiData(e);
        this.router.navigate([PATHS.login.staff]);
      }
    });
  }

  private buildAccountMenu(): MenuItem {
    return buildStaffAccountMenu(
      () => this.openChangePasswordDialog(),
      () => this.logout(),
    );
  }

  private withSharedMenu(items: MenuItem[]): MenuItem[] {
    return prependStaffCommonMenu(
      this.withApprovedAverageMenu(items),
      this.buildAccountMenu(),
      buildStaffAttendanceMenu(this.attendanceRouterLink),
    );
  }

  private withApprovedAverageMenu(items: MenuItem[]): MenuItem[] {
    const approvedAverageItem: MenuItem = {
      label: 'Promedio de Aprobados',
      icon: 'file-spreadsheet',
      routerLink: PATHS.academic.student.approvedAverage.path,
    };
    let added = false;

    const mappedItems = items.map(item => {
      const normalizedLabel = this.normalizeMenuLabel(item.label);
      const isAcademicMenu = normalizedLabel.includes('academic') || normalizedLabel.includes('academica');
      const isStudentsMenu = normalizedLabel.includes('alumnos');

      if (isStudentsMenu) {
        added = true;
        return this.appendApprovedAverageToStudents(item, approvedAverageItem);
      }

      if (isAcademicMenu) {
        const children = item.items ?? [];
        const mappedChildren = children.map(child => {
          if (this.normalizeMenuLabel(child.label).includes('alumnos')) {
            added = true;
            return this.appendApprovedAverageToStudents(child, approvedAverageItem);
          }

          return child;
        });

        return {
          ...item,
          items: mappedChildren,
        };
      }

      return item;
    });

    if (added) {
      return mappedItems;
    }

    return [
      ...mappedItems,
      approvedAverageItem,
    ];
  }

  private appendApprovedAverageToStudents(item: MenuItem, approvedAverageItem: MenuItem): MenuItem {
    const children = item.items ?? [];
    const alreadyExists = children.some(child => child.routerLink === approvedAverageItem.routerLink);

    return {
      ...item,
      items: alreadyExists ? children : [...children, approvedAverageItem],
    };
  }

  private normalizeMenuLabel(label: string | undefined): string {
    return (label ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
