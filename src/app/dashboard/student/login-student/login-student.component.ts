import {Component, contentChild} from '@angular/core';
import {LoginBaseComponent} from '../../login-base/login-base.component';
import {NotificationService} from '../../../services/notification.service';
import {Router} from '@angular/router';
import {encodeArray} from '../../../helper/helper.util';
import {NOTIFICATION_MESSAGE} from '../../../core/constants/notification_message';
import {STATUS} from '../../../core/constants/status';
import {LoginService} from '../../../services/login.service';
import {UsersService} from '../../../services/users.service';
import {home_link, HomeKey} from '../../../core/constants/home_link';
import {PATHS} from '../../../core/constants/paths';

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
    private notificationService: NotificationService,
    private router: Router,
    private usersService: UsersService,
    private loginService: LoginService,
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
          if (route === undefined)
            route = PATHS.login.student;
            console.log('route: ' + route);
            // setTimeout(() => {
            //   this.router.navigate([route]);
            // }, 2000);
        }
        this.notificationService.notifyApiData(loginUserData);
      },
      error: (error) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(error);
      }
    });
  }

}
