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
    try {
      if (this.loginService.isStudentLoggedIn()) {
        return true;
      }
      else{
        window.location.href = `${location.origin}/${PATHS.login.student}`;
        return false;
      }
    } catch (e) {
      console.error('Error al validar la sesión del estudiante:', e);
      return false;
    }
  }
}
