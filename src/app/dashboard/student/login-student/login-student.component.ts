import { Component } from '@angular/core';
import {LoginBaseComponent} from '../../login-base/login-base.component';
import {NotificationService} from '../../../services/notification.service';
import {Router} from '@angular/router';
import {PaymentService} from '../../../services/payment.service';
import * as CryptoJS from 'crypto-js';
import {environment} from '../../../../environments/environment';
import jwtEncode from 'jwt-encode';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginBaseComponent], // Importa el componente LoginBaseComponent
  template: `
    <app-login-base
      [titleLabel]="'Iniciar Sesión'"
      [userLabel]="'Código de Usuario'"
      [alertMessage]="'El código es obligatorio'"
      [(user)]="user"
      [(password)]="password"
      (login)="login()"
    ></app-login-base>
  `,
})
export class LoginStudentComponent {
  user: string = '';
  password: string = '';

  constructor(
    private notification: NotificationService,
    private router: Router,
    private paymentService: PaymentService,
  ) {}

  login() {
    const key = environment.tokenKey;
    const payload = {
      code_student: this.user,
      password: this.password
    };

    let loginData = new FormData();
    loginData.append('payload', jwtEncode(payload, key))

    this.paymentService.validatePayment(loginData).subscribe({
      next: (paymentRes) => {
        if (paymentRes.status === 'success') {
          sessionStorage.setItem('payment_id', paymentRes.response.payload);
          // ✅ Guardar datos en la sesión
          this.notification.success(paymentRes.response.title, paymentRes.response.message);
          setTimeout(() => {
            this.router.navigate(['/student-card-registration']);
          }, 2000);
        } else if (paymentRes.status === 'warning') {
          this.notification.warning(paymentRes.response.title, paymentRes.response.message);
        }
      },
      error: (error) => {
        this.notification.error('Error de conexión', 'El servicio no esta disponible en este momento');
        console.error(error);
      }
    });
  }

}
