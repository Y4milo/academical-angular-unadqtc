import {ROLE} from '../../../core/constants/app-roles.constants';

/** Permiso que deja reabrir, anular y completar la resolución de una convocatoria cerrada o exportada (lo decide el API; aquí solo se muestran los botones). */
export const DEGREES_TITLES_REOPEN = 'degrees_titles.reopen';

interface SessionUser {
  role?: {value?: string} | null;
  permissions?: string[];
}

/**
 * Con permisos en la sesión decide el permiso; con una sesión iniciada antes de que existieran decide el rol de administrador, como siempre.
 */
export function canReopenCalls(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  if (Array.isArray(user.permissions)) return user.permissions.includes(DEGREES_TITLES_REOPEN);

  return user.role?.value === ROLE.admin;
}
