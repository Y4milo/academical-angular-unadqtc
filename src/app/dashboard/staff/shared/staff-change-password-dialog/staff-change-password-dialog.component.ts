import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';
import {ButtonDirective} from 'primeng/button';
import {Dialog} from 'primeng/dialog';
import {Password} from 'primeng/password';
import {UsersService} from '../../../../services/users.service';
import {NotificationService} from '../../../../services/notification.service';
import {STATUS} from '../../../../core/constants/api-status.constants';

@Component({
  selector: 'app-staff-change-password-dialog',
  imports: [
    ButtonDirective,
    Dialog,
    FormsModule,
    NgIf,
    Password,
  ],
  templateUrl: './staff-change-password-dialog.component.html',
  styleUrl: './staff-change-password-dialog.component.css'
})
export class StaffChangePasswordDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  savingPassword = false;

  constructor(
    private usersService: UsersService,
    private notificationService: NotificationService,
  ) {}

  close(): void {
    if (this.savingPassword) {
      return;
    }

    this.setVisible(false);
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
          this.setVisible(false);
          this.resetPasswordForm();
        }
      },
      error: (e) => {
        this.savingPassword = false;
        this.notificationService.notifyApiData(e);
      }
    });
  }

  private setVisible(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(visible);
  }

  private resetPasswordForm(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }
}
