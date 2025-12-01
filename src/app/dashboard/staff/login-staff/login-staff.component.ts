import { Component } from '@angular/core';
import {Router} from '@angular/router';
import {LoginBaseComponent} from '../../login-base/login-base.component';
import {NotificationService} from '../../../services/notification.service';
import {UsersService} from '../../../services/users.service';
import {LoginService} from '../../../services/login.service';
import {PATHS} from '../../../core/constants/paths';
import {home_link, HomeKey} from '../../../core/constants/home_link';
import {STATUS} from '../../../core/constants/status';
import {NOTIFICATION_MESSAGE} from '../../../core/constants/notification_message';


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
export class LoginStaffComponent {
  user: string = '';
  password: string = '';

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private usersService: UsersService,
    private loginService: LoginService
  ) {}

  login() {
    const loginData = new FormData();
    loginData.append('nick', this.user);
    loginData.append('password', this.password);

    this.usersService.logIn(loginData).subscribe({
      next: (loginUserData) => {
        if (loginUserData.status === STATUS.success) {
          const staff_user = this.loginService.setUser(loginUserData);
          const key = staff_user.role.value as HomeKey;
          let route = home_link[key];
          // console.log('route before: ' + route)
          if (route === undefined)
            route = PATHS.login.staff;
          setTimeout(() => {
            // console.log('route after: ' + route)
            // console.log('staff_user.role.value: ' + staff_user.role.value);
            this.router.navigate([route]);
          }, 2000);
        }
        this.notificationService.notifyApiData(loginUserData);
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    })
  }
}
