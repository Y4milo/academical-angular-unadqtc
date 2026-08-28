import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

const savedTheme = localStorage.getItem('academical-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.toggle('app-dark', savedTheme === 'dark' || (!savedTheme && prefersDark));

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
