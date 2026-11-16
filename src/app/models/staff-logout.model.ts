/** A dónde ir al cerrar sesión: el API lo decide según cómo se abrió la sesión (política de sesiones de Core). */
export interface StaffLogoutDestination {
  /** `core_logout`: «Cerrar también en Core», el navegador pasa por Core para cerrar su sesión. */
  next: 'core_portal' | 'local_login' | 'core_logout';
  portal_url: string | null;
  /** La dirección de Core que cierra su sesión desde el navegador (solo con `next = core_logout`). */
  core_logout_url?: string | null;
}
