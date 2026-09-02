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

const InstitutionalPreset = definePreset(Aura, {
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
