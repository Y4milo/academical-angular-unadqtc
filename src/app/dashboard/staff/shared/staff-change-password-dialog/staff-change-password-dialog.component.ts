import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {FormFieldComponent} from '../../../../core/components/form-field.component';
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
    FormFieldComponent,
    FormsModule,
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
  submitted = false;

  constructor(
    private usersService: UsersService,
    private notificationService: NotificationService,
  ) {}

  /** Mensajes junto a cada campo; vacíos hasta que el usuario intenta guardar. */
  get errors(): {current: string; new: string; confirm: string} {
    if (!this.submitted) {
      return {current: '', new: '', confirm: ''};
    }

    return {
      current: this.currentPassword ? '' : 'Ingresa tu contraseña actual.',
      new: !this.newPassword ? 'Ingresa la nueva contraseña.' : this.newPassword.length < 8 ? 'Debe tener al menos 8 caracteres.' : '',
      confirm: !this.confirmPassword ? 'Confirma la nueva contraseña.' : this.newPassword !== this.confirmPassword ? 'La confirmación no coincide.' : '',
    };
  }

  close(): void {
    if (this.savingPassword) {
      return;
    }

    this.setVisible(false);
    this.resetPasswordForm();
  }

  changePassword(): void {
    this.submitted = true;

    if (this.errors.current || this.errors.new || this.errors.confirm) {
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
    this.submitted = false;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }
}
