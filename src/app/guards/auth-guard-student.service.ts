import {Injectable} from '@angular/core';
import {
  CanActivate,
  Router,
} from '@angular/router';
import {jwtDecode} from 'jwt-decode';
import {Payment} from '../models/payment.model';
import {JwtService} from '../services/jwt.service';
import {paths} from '../core/constants/paths';


@Injectable({
  providedIn: 'root',
})

export class AuthGuardStudent implements CanActivate {

  constructor(
    private router: Router,
    private jwtService: JwtService,
  ) {}

  canActivate(): boolean {
    const paymentId = sessionStorage.getItem('payment_id');

    if (!paymentId) {
      window.location.href = `${location.origin}/${paths.login.student}`;
    }

    if (!this.jwtService.isJWT(paymentId!)) {
      window.location.href = `${location.origin}/${paths.login.student}`;
      return false;
    }

    try {
      const userStudent: Payment = jwtDecode(paymentId!);

      if (userStudent.user_type_value !== 'student') {
        // Redirigir al login si no es estudiante
        window.location.href = `${location.origin}/${paths.login.student}`;
        return false;
      }

      return true;
    } catch (e) {
      console.error('Error al decodificar el token:', e);
      return false;
    }
  }
}

// export const authGuard: CanActivateFn = (route, state) => {
//   return true;
// };
