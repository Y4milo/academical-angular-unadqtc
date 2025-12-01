import {Component, contentChild} from '@angular/core';
import {LoginBaseComponent} from '../../login-base/login-base.component';
import {NotificationService} from '../../../services/notification.service';
import {Router} from '@angular/router';
import {PaymentService} from '../../../services/payment.service';
import {encodeArray} from '../../../helper/helper.util';
import {NOTIFICATION_MESSAGE} from '../../../core/constants/notification_message';
import {STATUS} from '../../../core/constants/status';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginBaseComponent], // Importa el componente LoginBaseComponent
  template: `
    <app-login-base
      [titleLabel]="'Iniciar Sesión'"
      [userLabel]="'Código de Alumno'"
      [userAlertMessage]="'El código es obligatorio'"
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
    const payload = {
      code_student: this.user,
      password: this.password
    };
    const loginData = encodeArray(payload);

    this.paymentService.validatePayment(loginData).subscribe({
      next: (paymentRes) => {
        // if (paymentRes.status === STATUS.success) {
        //   sessionStorage.setItem('payment_id', paymentRes.payload.data);
        //   // ✅ Guardar datos en la sesión
        //   this.notification.success(paymentRes.payload.title, paymentRes.payload.message);
        //   setTimeout(() => {
        //     this.router.navigate(['/student-card-registration']);
        //   }, 2000);
        // } else if (paymentRes.status === 'warning') {
        //   this.notification.warning(paymentRes.payload.title, paymentRes.payload.message);
        // }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(error);
      }
    });
  }

}
