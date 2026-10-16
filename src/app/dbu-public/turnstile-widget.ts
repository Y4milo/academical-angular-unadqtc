import { AfterViewInit, Component, ElementRef, Input, OnDestroy, Output, ViewChild, EventEmitter } from '@angular/core';

interface TurnstileApi {
  render(host: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window { turnstile?: TurnstileApi }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable')));
    script.onerror = () => { scriptPromise = null; reject(new Error('Turnstile failed to load')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Desafío de Cloudflare Turnstile. No tiene equivalente en PrimeNG: este componente solo aloja el widget oficial y
 * emite el token (o null si vence o falla). La validación real ocurre en el backend.
 */
@Component({
  selector: 'app-turnstile',
  standalone: true,
  template: `<div #host class="turnstile" data-testid="turnstile"></div>`,
  styles: `:host { display: block; min-height: 4.1rem; }`,
})
export class TurnstileWidgetComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) siteKey = '';
  @Output() tokenChange = new EventEmitter<string | null>();
  @Output() failed = new EventEmitter<void>();

  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;
  private widgetId: string | null = null;

  async ngAfterViewInit(): Promise<void> {
    try {
      const api = await loadTurnstile();
      this.widgetId = api.render(this.host.nativeElement, {
        sitekey: this.siteKey,
        language: 'es',
        callback: (token: string) => this.tokenChange.emit(token),
        'expired-callback': () => this.tokenChange.emit(null),
        'error-callback': () => this.tokenChange.emit(null),
      });
    } catch {
      this.failed.emit();
    }
  }

  /** Pide un desafío nuevo: el token de Turnstile es de un solo uso. */
  reset(): void {
    if (this.widgetId && window.turnstile) {
      window.turnstile.reset(this.widgetId);
      this.tokenChange.emit(null);
    }
  }

  ngOnDestroy(): void {
    if (this.widgetId && window.turnstile) {
      window.turnstile.remove(this.widgetId);
    }
  }
}
