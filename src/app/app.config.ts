import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import {definePreset} from '@primeuix/themes';
import {MessageService} from 'primeng/api';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {credentialsInterceptor} from './interceptors/credentials.interceptor';
import {sessionExpiredInterceptor} from './interceptors/session-expired.interceptor';
import {SessionSyncService} from './services/session-sync.service';

/**
 * Aura trae su propio peso y tamaño por componente (botón 500, tag 700, tarjeta 500 de 1.25 rem, mensaje 500...). Se
 * llevan a los tokens de styles.css (`--weight-*`, `--text-*`) para que todo PrimeNG herede la misma escala que el menú.
 */
const typography = {
  button: {root: {label: {fontWeight: 'var(--weight-strong)'}}},
  tag: {root: {fontSize: 'var(--text-label)', fontWeight: 'var(--weight-regular)', padding: '0.375rem 0.75rem'}},
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

/**
 * Colors of the UNADQTC identity manual, identical to the signer (signner-app `unadqtc.preset.ts`, owner's rule: both
 * systems look the same): 500 of the primary is the official cardinal red #D61016, dark mode lightens it to #E14E53,
 * and the neutral surfaces are the manual's. Do not tune a value here without changing the signer too.
 */
export const InstitutionalPreset = definePreset(Aura, {
  components: typography,
  semantic: {
    primary: {
      50: '#FCEEEF',
      100: '#F8D9DA',
      200: '#F2B3B4',
      300: '#EA888A',
      400: '#E14E53',
      500: '#D61016',
      600: '#B80E13',
      700: '#960B0F',
      800: '#74090C',
      900: '#510608',
      950: '#330405',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        surface: {
          0: '#ffffff',
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#6B6B6A',
          600: '#52525B',
          700: '#3D393B',
          800: '#27272A',
          900: '#1D1D1B',
          950: '#09090B',
        },
      },
      dark: {
        primary: {
          color: '{primary.400}',
          contrastColor: '#18181B',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        surface: {
          0: '#ffffff',
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#202024',
          950: '#18181B',
        },
      },
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
    providePrimeNG({
      theme: {
        preset: InstitutionalPreset,
        options: {darkModeSelector: '.app-dark'}
      }
    }),
    MessageService,
    // The session belongs to the browser: when one tab closes it, the others leave too.
    provideAppInitializer(() => inject(SessionSyncService).start()),
  ]
};
