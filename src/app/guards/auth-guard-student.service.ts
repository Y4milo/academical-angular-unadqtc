import {Injectable} from '@angular/core';
import {
  CanActivate,
} from '@angular/router';
import {PATHS} from '../core/constants/paths';
import {LoginService} from '../services/login.service';


@Injectable({
  providedIn: 'root',
})

export class AuthGuardStudent implements CanActivate {

  constructor(
    private loginService: LoginService,
  ) {}

  canActivate(): boolean {
    const paymentId = sessionStorage.getItem('payment_id');
    const loginUser = sessionStorage.getItem('user');

    if (!paymentId) {
      window.location.href = `${location.origin}/${PATHS.login.student}`;
      return false;
    }

    try {
      if (!loginUser) {
        window.location.href = `${location.origin}/${PATHS.login.student}`;
        return false;
      }

      const userStudent = this.loginService.getUser();

      if (userStudent.role.value !== 'student') {
        window.location.href = `${location.origin}/${PATHS.login.student}`;
        return false;
      }

      return true;
    } catch (e) {
      console.error('Error al validar la sesion del estudiante:', e);
      return false;
    }
  }
}

// export const authGuard: CanActivateFn = (route, state) => {
//   return true;
// };
