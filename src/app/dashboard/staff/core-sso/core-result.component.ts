import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CoreSsoFailure, CoreSsoService } from './core-sso.service';

type Tone = 'warn' | 'danger' | 'info';

interface ResultCopy {
  icon: string;
  tone: Tone;
  title: string;
  body: string;
  /** Qué hacer: una línea, o nada si basta con el cuerpo. */
  todo?: string;
  /** El problema es temporal: se ofrece volver a intentar. */
  retry?: boolean;
}

/** Lo que se le dice a la persona por cada motivo (los códigos los fija el API; nunca se muestra texto técnico). */
export const CORE_RESULT_COPY: Record<string, ResultCopy> = {
  not_linked: {
    icon: 'pi-link',
    tone: 'warn',
    title: 'Tu cuenta de Core aún no está vinculada',
    body: 'Entraste a Core correctamente, pero todavía no tienes un usuario de Academical asociado a esa cuenta.',
    todo: 'Pide a la Oficina de Tecnologías de la Información que vincule tu cuenta. Menciona el código para que la encuentren más rápido.',
  },
  inactive: {
    icon: 'pi-user-minus',
    tone: 'warn',
    title: 'Tu usuario de Academical está inactivo',
    body: 'Tu cuenta de Core funciona, pero tu usuario en Academical está desactivado.',
    todo: 'Comunícate con la Oficina de Tecnologías de la Información para reactivarlo y menciona el código.',
  },
  core_unreachable: {
    icon: 'pi-wifi',
    tone: 'danger',
    title: 'No pudimos conectar con Core',
    body: 'Tu sesión de Core sigue abierta. El problema suele ser temporal: vuelve a intentarlo en unos segundos.',
    retry: true,
  },
  access_denied: {
    icon: 'pi-times-circle',
    tone: 'info',
    title: 'Cancelaste el ingreso con Core',
    body: 'No se abrió ninguna sesión en Academical. Puedes intentarlo de nuevo cuando quieras.',
    retry: true,
  },
};

export const CORE_RESULT_GENERIC: ResultCopy = {
  icon: 'pi-exclamation-triangle',
  tone: 'danger',
  title: 'No pudimos completar el ingreso',
  body: 'Algo falló al entrar con tu cuenta de Core. No se abrió ninguna sesión en Academical.',
  todo: 'Inténtalo nuevamente. Si sigue fallando, avisa a la Oficina de Tecnologías de la Información con el código.',
  retry: true,
};

/**
 * La página que ve quien intentó entrar con Core y no pudo: dice qué pasó en palabras de la persona, quién entró en Core, qué hacer y un código de
 * referencia para dar a la Oficina de Tecnologías de la Información. Con el modo obligatorio no ofrece el ingreso de Academical (ya no existe); si
 * el modo es opcional, sí lo ofrece como salida.
 */
@Component({
  selector: 'app-core-result',
  imports: [ButtonModule],
  templateUrl: './core-result.component.html',
  styleUrl: './core-result.component.css',
})
export class CoreResultComponent implements OnInit {
  private readonly service = inject(CoreSsoService);

  readonly reason = input<string>('');
  /** El ingreso de Academical está oculto (modo obligatorio): no se ofrece como salida. */
  readonly required = input(false);
  readonly portalUrl = input<string | null>(null);
  /** La persona pide entrar con usuario y contraseña (solo en el modo opcional). */
  readonly useLocalLogin = output<void>();

  readonly failure = signal<CoreSsoFailure | null>(null);
  readonly copied = signal(false);

  get copy(): ResultCopy {
    return CORE_RESULT_COPY[this.reason()] ?? CORE_RESULT_GENERIC;
  }

  ngOnInit(): void {
    this.service.failure().subscribe({ next: ({ failure }) => this.failure.set(failure), error: () => this.failure.set(null) });
  }

  retry(): void {
    this.service.goTo(this.service.redirectUrl());
  }

  backToCore(): void {
    const url = this.portalUrl();
    if (url) this.service.goTo(url);
  }

  async copyReference(): Promise<void> {
    const reference = this.failure()?.reference;
    if (!reference) return;

    try {
      await navigator.clipboard.writeText(reference);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    } catch {
      this.copied.set(false);
    }
  }
}
