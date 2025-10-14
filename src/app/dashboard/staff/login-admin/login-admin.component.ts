import { Component } from '@angular/core';
import {LoginBaseComponent} from '../../login-base/login-base.component';
import {NotificationService} from '../../../services/notification.service';
import {Router} from '@angular/router';
import {UsersService} from '../../../services/users.service';

@Component({
  imports: [LoginBaseComponent],
  template: `
    <app-login-base
      [titleLabel]="'Iniciar Sesión'"
      [userLabel]="'Personal Universitario'"
      [userAlertMessage]="'El usuario es obligatorio'"
      [(user)]="user"
      [(password)]="password"
      (login)="login()"
    ></app-login-base>
  `,
})
export class LoginAdminComponent {
  user: string = '';
  password: string = '';

  constructor(
    private notification: NotificationService,
    private router: Router,
    private usersService: UsersService
  ) {}

  login() {
    const payload = {
      user: this.user,
      password: this.password
    };

    const loginData = new FormData();
    loginData.append('payload', JSON.stringify(payload));

    this.usersService.logIn(loginData).subscribe({
      next: (loginUserData) => {
        if (loginUserData.status === 'success') {
          const userLogin = loginUserData.payload.data;
          sessionStorage.setItem('login_id', JSON.stringify(userLogin));
          let route = "/admin";
          switch (userLogin.role_id.value) {
            case "accounting":
              route += "/accounting-payments";
              break;
            case "academic":
              route += "/student-cards";
              break;
              // ASISTENCIA PARA DOCENTES Y ADMINISTRATIVOS
            case "professor":
            case "administrative":
              route += "/attendances";
          }
          setTimeout(() => {
            this.router.navigate([route]);
          }, 2000);
        }
        this.notification.notifyApiData(loginUserData);
      },
      error: (e) => {
        this.notification.error('Error de conexión', 'El servicio no esta disponible en este momento');
        console.error(e);
      }
    })
  }
}
