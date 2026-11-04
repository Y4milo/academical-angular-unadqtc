import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PATHS } from '../../../core/constants/app-paths.constants';
import { CoreSsoService } from './core-sso.service';

/**
 * Adonde llega quien pulsa «Entrar» desde Core. Si Academical está integrada a Core, sigue directo a Core (que ya lo conoce) y vuelve con la
 * sesión abierta, sin pedir usuario ni contraseña; si no lo está, lo lleva al ingreso de siempre.
 */
@Component({
  selector: 'app-core-entry',
  imports: [ProgressSpinnerModule],
  template: `
    <main class="core-sso-wait" aria-live="polite" data-testid="core-entry">
      <p-progress-spinner strokeWidth="4" ariaLabel="Entrando con tu cuenta de Core" />
      <p>Entrando con tu cuenta de Core…</p>
    </main>
  `,
  styleUrl: './core-sso-wait.css',
})
export class CoreEntryComponent implements OnInit {
  private readonly service = inject(CoreSsoService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.service.status().subscribe({
      next: ({ enabled }) => (enabled ? this.goToCore() : this.goToLogin()),
      error: () => this.goToLogin(),
    });
  }

  private goToCore(): void {
    this.service.goTo(this.service.redirectUrl());
  }

  private goToLogin(): void {
    void this.router.navigate(['/', PATHS.login.staff]);
  }
}
