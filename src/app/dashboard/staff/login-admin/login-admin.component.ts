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
    const loginData = new FormData();
    loginData.append('nick', this.user);
    loginData.append('password', this.password);

    this.usersService.logIn(loginData).subscribe({
      next: (loginUserData) => {
        if (loginUserData.status === 'success') {
          const userLogin = loginUserData.payload.data;
          sessionStorage.setItem('user', JSON.stringify(userLogin));
          let route = "";
          switch (userLogin.role.value) {
            case "accounting":
              route += "/admin/accounting-payments";
              break;
            case "academic":
              route += "/admin/student-cards";
              break;
              // ASISTENCIA PARA DOCENTES Y ADMINISTRATIVOS
            case "professor":
            case "administrative":
              route = "/staff/attendance-user";
              break;
            case "human-resources":
              // route = "/staff/attendance";
              route = "/hr";
              break;
          }
          setTimeout(() => {
            // console.log(route)
            // console.log(userLogin.role.value);
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
