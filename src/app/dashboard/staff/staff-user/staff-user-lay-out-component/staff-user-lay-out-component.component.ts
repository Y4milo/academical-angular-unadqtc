import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import {ButtonDirective} from 'primeng/button';
import {Dialog} from 'primeng/dialog';
import {MenuItem, PrimeTemplate} from 'primeng/api';
import {Menubar} from 'primeng/menubar';
import {Password} from 'primeng/password';
import {Fingerprint, LockKeyhole, LogOut, LucideAngularModule} from 'lucide-angular';
import {PATHS} from '../../../../core/constants/paths';
import {UsersService} from '../../../../services/users.service';
import {NotificationService} from '../../../../services/notification.service';
import {LoginService} from '../../../../services/login.service';
import {STATUS} from '../../../../core/constants/status';

@Component({
  selector: 'app-staff-user-lay-out-component',
  imports: [
    ButtonDirective,
    Dialog,
    FormsModule,
    LucideAngularModule,
    Menubar,
    NgIf,
    Password,
    PrimeTemplate,
    RouterLink,
    RouterOutlet
  ],
  templateUrl: './staff-user-lay-out-component.component.html',
  styleUrl: './staff-user-lay-out-component.component.css'
})
export class StaffUserLayOutComponentComponent implements OnInit {
  items: MenuItem[] | undefined;
  showChangePasswordDialog = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  savingPassword = false;
  loggingOut = false;

  constructor(
    private usersService: UsersService,
    private notificationService: NotificationService,
    private loginService: LoginService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.items = [
      {
        label: 'Mi cuenta',
        lucide: Fingerprint,
        items: [
          {
            label: 'Cambiar contraseña',
            lucide: LockKeyhole,
            command: () => this.openChangePasswordDialog(),
          },
          {
            label: 'Cerrar Sesión',
            lucide: LogOut,
            command: () => this.logout(),
          },
        ],
      },
    ];
  }

  onMenuItemClick(event: Event, item: MenuItem): void {
    if (item.command) {
      event.preventDefault();
      item.command({ originalEvent: event, item });
    }
  }

  openChangePasswordDialog(): void {
    this.resetPasswordForm();
    this.showChangePasswordDialog = true;
  }

  closeChangePasswordDialog(): void {
    if (this.savingPassword) {
      return;
    }

    this.showChangePasswordDialog = false;
    this.resetPasswordForm();
  }

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.notificationService.warning('Formulario incompleto', 'Completa todos los campos.');
      return;
    }

    if (this.newPassword.length < 8) {
      this.notificationService.warning('Contraseña muy corta', 'La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.notificationService.warning('Confirmación incorrecta', 'La confirmación de la contraseña no coincide.');
      return;
    }

    const passwordData = new FormData();
    passwordData.append('current_password', this.currentPassword);
    passwordData.append('password', this.newPassword);
    passwordData.append('password_confirmation', this.confirmPassword);

    this.savingPassword = true;

    this.usersService.changeStaffPassword(passwordData).subscribe({
      next: (response) => {
        this.savingPassword = false;
        this.notificationService.notifyApiData(response);

        if (response.status === STATUS.success) {
          this.showChangePasswordDialog = false;
          this.resetPasswordForm();
        }
      },
      error: (e) => {
        this.savingPassword = false;
        this.notificationService.notifyApiData(e);
      }
    });
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

  private resetPasswordForm(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }
}
