import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import {definePreset} from '@primeng/themes';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {MessageService} from 'primeng/api';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {credentialsInterceptor} from './interceptors/credentials.interceptor';
import {sessionExpiredInterceptor} from './interceptors/session-expired.interceptor';

/**
 * Aura trae su propio peso y tamaño por componente (botón 500, tag 700, tarjeta 500 de 1.25 rem, mensaje 500...). Se
 * llevan a los tokens de styles.css (`--weight-*`, `--text-*`) para que todo PrimeNG herede la misma escala que el menú.
 */
const typography = {
  button: {root: {label: {fontWeight: 'var(--weight-strong)'}}},
  tag: {root: {fontSize: 'var(--text-small)', fontWeight: 'var(--weight-strong)', padding: '0.375rem 0.75rem'}},
  /* Relleno estándar de todo card (aprobado 2026-11-10): 24 px (16 px en teléfono, ver styles.css), 16 px del título al contenido. */
  card: {title: {fontSize: 'var(--text-card-title)', fontWeight: 'var(--weight-strong)'}, body: {padding: 'var(--space-5)', gap: 'var(--space-4)'}, caption: {gap: 'var(--space-4)'}},
  message: {text: {fontSize: 'var(--text-body)', fontWeight: 'var(--weight-regular)'}},
  dialog: {title: {fontSize: 'var(--text-card-title)', fontWeight: 'var(--weight-strong)'}},
  panel: {title: {fontWeight: 'var(--weight-strong)'}},
  /* Relleno estándar de toda tabla (aprobado 2026-11-10): celda de 12 px arriba y abajo y 16 px a los lados, también en `size="small"`. */
  datatable: {
    columnTitle: {fontWeight: 'var(--weight-strong)'},
    headerCell: {padding: 'var(--space-3) var(--space-4)', sm: {padding: 'var(--space-3) var(--space-4)'}},
    bodyCell: {padding: 'var(--space-3) var(--space-4)', sm: {padding: 'var(--space-3) var(--space-4)'}},
    footerCell: {padding: 'var(--space-3) var(--space-4)', sm: {padding: 'var(--space-3) var(--space-4)'}},
  },
  tabs: {tab: {fontWeight: 'var(--weight-strong)'}},
};

export const InstitutionalPreset = definePreset(Aura, {
  components: typography,
  semantic: {
    primary: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#d40f1c',
      600: '#bd0d19',
      700: '#a50812',
      800: '#881018',
      900: '#74121a',
      950: '#41070b',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        credentialsInterceptor,
        sessionExpiredInterceptor,
      ])
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: InstitutionalPreset,
        options: {darkModeSelector: '.app-dark'}
      }
    }),
    MessageService,
  ]
};
