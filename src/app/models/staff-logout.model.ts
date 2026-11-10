/** A dónde ir al cerrar sesión: el API lo decide según cómo se abrió la sesión (política de sesiones de Core). */
export interface StaffLogoutDestination {
  next: 'core_portal' | 'local_login';
  portal_url: string | null;
}
