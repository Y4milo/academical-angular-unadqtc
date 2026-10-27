import { Injectable } from '@angular/core';

/** Avisos del firmador de Firma Perú: `init` al abrirse, `ok` al terminar y `cancel` si la persona lo cierra. */
export interface SignerHandlers {
  init?: () => void;
  ok: () => void;
  cancel: () => void;
}

interface FirmaPeruWindow extends Window {
  jQuery?: { noConflict(removeAll: boolean): unknown };
  jqFirmaPeru?: unknown;
  startSignature?: (port: string, param: string) => void;
  signatureInit?: () => void;
  signatureOk?: () => void;
  signatureCancel?: () => void;
}

const JQUERY_URL = 'https://code.jquery.com/jquery-3.6.0.min.js';

/**
 * Habla con el firmador local de Firma Perú (token, DNIe o certificado instalado). Su script oficial solo se carga cuando
 * se va a firmar, no en el resto del sistema, porque es código de un tercero.
 */
@Injectable({ providedIn: 'root' })
export class FirmaPeruSignerService {
  private loaded: Promise<void> | null = null;

  /** ¿El navegador es Edge en Windows? Es el que recomienda la PCM para el firmador. */
  environment(): { browser: string; recommended: boolean; windows: boolean } {
    const agent = navigator.userAgent;
    const edge = /Edg\//.test(agent);
    const browser = edge ? 'Microsoft Edge' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Google Chrome' : 'Otro navegador';
    return { browser, recommended: edge, windows: /Windows/.test(agent) };
  }

  load(scriptUrl: string): Promise<void> {
    this.loaded ??= this.loadScripts(scriptUrl).catch(error => {
      this.loaded = null;
      throw error;
    });
    return this.loaded;
  }

  start(port: number, param: string, handlers: SignerHandlers): void {
    const target = window as FirmaPeruWindow;
    target.signatureInit = () => handlers.init?.();
    target.signatureOk = () => handlers.ok();
    target.signatureCancel = () => handlers.cancel();
    if (!target.startSignature) {
      throw new Error('El firmador de Firma Perú no se cargó.');
    }
    target.startSignature(String(port), param);
  }

  private async loadScripts(scriptUrl: string): Promise<void> {
    const target = window as FirmaPeruWindow;
    if (!document.getElementById('addComponent')) {
      const holder = document.createElement('div');
      holder.id = 'addComponent';
      holder.style.display = 'none';
      document.body.appendChild(holder);
    }
    await this.addScript(JQUERY_URL);
    target.jqFirmaPeru = target.jQuery?.noConflict(true);
    await this.addScript(scriptUrl);
  }

  private addScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(script);
    });
  }
}
