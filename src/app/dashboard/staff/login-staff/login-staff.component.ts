import { Component, OnInit, inject, signal } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {navigateAfterLogin} from '../../../core/utils/return-url.util';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {CoreResultComponent} from '../core-sso/core-result.component';
import {CoreSsoService, CoreSsoStatus} from '../core-sso/core-sso.service';
import {LoginBaseComponent} from '../../login-base/login-base.component';
import {NotificationService} from '../../../services/notification.service';
import {UsersService} from '../../../services/users.service';
import {LoginService} from '../../../services/login.service';
import {PATHS} from '../../../core/constants/app-paths.constants';
import {home_link, HomeKey} from '../../../core/constants/home-routes.constants';
import {STATUS} from '../../../core/constants/api-status.constants';
import {NOTIFICATION_MESSAGE} from '../../../core/constants/app-messages.constants';


@Component({
  imports: [LoginBaseComponent, CoreResultComponent, ProgressSpinnerModule],
  template: `
    @switch (view()) {
      @case ('login') {
        <app-login-base
          [titleLabel]="'Iniciar Sesión'"
          [userLabel]="'Personal Universitario'"
          [userAlertMessage]="'El usuario es obligatorio'"
          [(user)]="user"
          [(password)]="password"
          (login)="login()"
        ></app-login-base>
      }
      @case ('result') {
        <app-core-result [reason]="coreError" [required]="!!status()?.required" [portalUrl]="status()?.portal_url ?? null" (useLocalLogin)="view.set('login')"></app-core-result>
      }
      @default {
        <main class="core-sso-wait" aria-live="polite" data-testid="core-redirecting">
          <p-progress-spinner strokeWidth="4" ariaLabel="Entrando con tu cuenta de Core" />
          <p>{{ view() === 'redirecting' ? 'Te llevamos a Core para entrar…' : 'Preparando el ingreso…' }}</p>
        </main>
      }
    }
  `,
  styleUrl: '../core-sso/core-sso-wait.css',
})
export class LoginStaffComponent implements OnInit {
  private readonly coreSso = inject(CoreSsoService);

  user: string = '';
  password: string = '';
  /** Código por el que falló el último ingreso con Core, cuando la persona vuelve de ahí sin sesión. */
  coreError = '';
  /** Qué se muestra: el ingreso de siempre, el resultado de un ingreso con Core que falló, o una espera mientras se decide. */
  readonly view = signal<'checking' | 'login' | 'result' | 'redirecting'>('checking');
  readonly status = signal<CoreSsoStatus | null>(null);

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private usersService: UsersService,
    private loginService: LoginService
  ) {
    this.coreError = this.activatedRoute.snapshot.queryParamMap.get('core_error') ?? '';
  }

  /**
   * Con el modo obligatorio el ingreso de Academical no aparece: se manda a Core. Si Core o la configuración fallan, el API dice que no es
   * obligatorio y el ingreso de siempre vuelve a aparecer (salida de emergencia). Un ingreso con Core que falló muestra su resultado.
   */
  ngOnInit(): void {
    this.coreSso.status().subscribe({
      next: status => {
        this.status.set(status);
        if (this.coreError) return this.view.set('result');
        if (status.required) {
          this.view.set('redirecting');
          return this.coreSso.goTo(this.coreSso.redirectUrl());
        }
        this.view.set('login');
      },
      error: () => this.view.set(this.coreError ? 'result' : 'login'),
    });
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
