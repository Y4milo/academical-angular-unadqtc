// login-base.component.ts
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ButtonDirective} from 'primeng/button';
import {Card} from 'primeng/card';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {NgClass, NgIf} from '@angular/common';
import {Password} from 'primeng/password';
import {PrimeTemplate} from 'primeng/api';
import {NotificationService} from '../../services/notification.service';

@Component({
  selector: 'app-login-base',
  standalone: true,
  imports: [
    ButtonDirective,
    Card,
    FormsModule,
    InputText,
    NgIf,
    Password,
    PrimeTemplate,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './login-base.component.html',
  styleUrl: './login-base.component.css'
})
export class LoginBaseComponent {
  @Input() user: string = '';
  @Input() password: string = '';

  @Input() titleLabel: string = '';
  @Input() userLabel: string = '';
  @Input() userAlertMessage: string = '';

  @Output() userChange = new EventEmitter<string>();
  @Output() passwordChange = new EventEmitter<string>();
  // El Output 'login' sigue emitiendo un evento vacío, lo cual es correcto.
  @Output() login = new EventEmitter<void>();

  constructor(
    private notification: NotificationService,
  )
  {  }


  onLoginClick(form: any) {
    if (form.invalid) {
      // Marca todos los controles como "tocados" para mostrar errores
      Object.values(form.controls).forEach((control: any) => {
        control.markAsTouched();
      });
      return; // Evita lanzar el evento login
    }
    // Si todo está válido, emite el evento login
    this.login.emit();
  }


  onUserChange(value: string) {
    this.userChange.emit(value);
  }

  onPasswordChange(value: string) {
    this.passwordChange.emit(value);
  }
}
