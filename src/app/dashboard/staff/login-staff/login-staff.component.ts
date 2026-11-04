import { Component } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {navigateAfterLogin} from '../../../core/utils/return-url.util';
import {MessageModule} from 'primeng/message';
import {coreSsoErrorMessage} from '../core-sso/core-sso.service';
import {LoginBaseComponent} from '../../login-base/login-base.component';
import {NotificationService} from '../../../services/notification.service';
import {UsersService} from '../../../services/users.service';
import {LoginService} from '../../../services/login.service';
import {PATHS} from '../../../core/constants/app-paths.constants';
import {home_link, HomeKey} from '../../../core/constants/home-routes.constants';
import {STATUS} from '../../../core/constants/api-status.constants';
import {NOTIFICATION_MESSAGE} from '../../../core/constants/app-messages.constants';


@Component({
  imports: [LoginBaseComponent, MessageModule],
  template: `
    @if (coreError) {
      <div class="core-error"><p-message severity="warn" data-testid="core-error">{{ coreError }}</p-message></div>
    }
    <app-login-base
      [titleLabel]="'Iniciar Sesión'"
      [userLabel]="'Personal Universitario'"
      [userAlertMessage]="'El usuario es obligatorio'"
      [(user)]="user"
      [(password)]="password"
      (login)="login()"
    ></app-login-base>
  `,
  styles: ['.core-error { max-width: 28rem; margin: var(--space-4) auto 0; padding: 0 var(--space-4); }'],
})
export class LoginStaffComponent {
  user: string = '';
  password: string = '';
  /** Por qué falló el ingreso con Core, cuando la persona vuelve de ahí sin sesión. */
  coreError = '';

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private usersService: UsersService,
    private loginService: LoginService
  ) {
    this.coreError = coreSsoErrorMessage(this.activatedRoute.snapshot.queryParamMap.get('core_error'));
  }

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
            navigateAfterLogin(this.router, this.activatedRoute.snapshot.queryParamMap.get('returnUrl'), route);
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
