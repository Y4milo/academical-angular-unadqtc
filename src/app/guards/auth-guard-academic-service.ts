import {Injectable} from '@angular/core';
import {
  CanActivate,
  Router,
} from '@angular/router';
import {UserLogin} from '../models/user-login.model';
import {jwtDecode} from 'jwt-decode';
import {JwtService} from '../services/jwt.service';
import {log} from '@angular-devkit/build-angular/src/builders/ssr-dev-server';


@Injectable({
  providedIn: 'root',
})

export class AuthGuardAcademic implements CanActivate {

  constructor(
    private router: Router,
    private jwtService: JwtService,
  ) {}

  canActivate(): boolean {
    const loginToken = sessionStorage.getItem('login_id');
    if (this.jwtService.isJWT(loginToken)) {
      const userAdmin:UserLogin = jwtDecode(loginToken);
      if (userAdmin.user_type_value !== 'academic') {
        // 🔁 Redirigir al login si no hay sesión
        this.router.navigate(['/login-admin']);
        return false;
      }
    } else {
      return false;
    }

    return true;
  }
}

// export const authGuard: CanActivateFn = (route, state) => {
//   return true;
// };
