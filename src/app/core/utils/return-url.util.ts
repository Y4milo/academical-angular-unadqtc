import {Router} from '@angular/router';

/** Solo se acepta una ruta interna de la aplicación (evita redirecciones a otros sitios) y nunca la del login. */
export function safeReturnUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.includes('login')) {
    return null;
  }

  return url;
}

/** Tras iniciar sesión vuelve a la página que se intentaba abrir; si no hay (o el rol no tiene acceso) va al inicio del rol. */
export function navigateAfterLogin(router: Router, returnUrl: string | null | undefined, home: string): void {
  const target = safeReturnUrl(returnUrl);

  if (!target) {
    router.navigate([home]);
    return;
  }

  router.navigateByUrl(target).then((ok) => {
    if (!ok) {
      router.navigate([home]);
    }
  });
}
