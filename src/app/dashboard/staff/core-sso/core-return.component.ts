import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { STATUS } from '../../../core/constants/api-status.constants';
import { PATHS } from '../../../core/constants/app-paths.constants';
import { HomeKey, home_link } from '../../../core/constants/home-routes.constants';
import { LoginService } from '../../../services/login.service';
import { CoreSsoService } from './core-sso.service';

/**
 * A donde vuelve la persona desde Core con la sesión ya abierta por el API: arma su sesión en el navegador como lo hace el ingreso normal y la
 * lleva a su pantalla de inicio. Si no hay sesión, vuelve al ingreso.
 */
@Component({
  selector: 'app-core-return',
  imports: [ProgressSpinnerModule],
  template: `
    <main class="core-sso-wait" aria-live="polite" data-testid="core-return">
      <p-progress-spinner strokeWidth="4" ariaLabel="Abriendo tu sesión" />
      <p>Abriendo tu sesión…</p>
    </main>
  `,
  styleUrl: './core-sso-wait.css',
})
export class CoreReturnComponent implements OnInit {
  private readonly service = inject(CoreSsoService);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.service.session().subscribe({
      next: response => {
        if (response.status !== STATUS.success) return this.goToLogin();

        const user = this.loginService.setUser(response);
        void this.router.navigateByUrl(home_link[user.role.value as HomeKey] ?? PATHS.login.staff);
      },
      error: () => this.goToLogin(),
    });
  }

  private goToLogin(): void {
    void this.router.navigate(['/', PATHS.login.staff], { queryParams: { core_error: 'invalid_response' } });
  }
}
