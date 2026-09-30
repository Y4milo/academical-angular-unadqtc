import {CoreFieldSource, CoreResolvedField, CoreSnapshotStatus, DegreeGeneralAuthority, DegreeGeneralAuthorityAuditAction, DegreeGeneralAuthorityRoleKey} from '../../../services/degrees-titles.service';

export const ROLE_TITLES: Record<DegreeGeneralAuthorityRoleKey, string> = {
  gyt_responsible: 'Responsable de Grados y Títulos',
  president: 'Presidencia de la Comisión Organizadora',
  academic_vicepresident: 'Vicepresidencia Académica',
  secretary_general: 'Secretaría General',
};

export const EDITABLE_ROLE_KEYS: DegreeGeneralAuthorityRoleKey[] = [
  'gyt_responsible', 'president', 'academic_vicepresident', 'secretary_general',
];

export function roleTitle(key: string): string {
  return ROLE_TITLES[key as DegreeGeneralAuthorityRoleKey] ?? key;
}

export function isResponsibleRole(key: DegreeGeneralAuthorityRoleKey): boolean {
  return key === 'gyt_responsible';
}

export function designateActionLabel(key: DegreeGeneralAuthorityRoleKey): string {
  return isResponsibleRole(key) ? 'Designar responsable' : 'Designar autoridad';
}

export function changeActionLabel(key: DegreeGeneralAuthorityRoleKey): string {
  return isResponsibleRole(key) ? 'Cambiar responsable' : 'Cambiar autoridad';
}

export function confirmActionLabel(key: DegreeGeneralAuthorityRoleKey): string {
  return isResponsibleRole(key) ? 'Establecer como responsable actual' : 'Establecer como autoridad actual';
}

export function personLabel(key: DegreeGeneralAuthorityRoleKey): string {
  return isResponsibleRole(key) ? 'responsable' : 'autoridad';
}

export function maskDni(number: string): string {
  return number.length > 2 ? '••••••' + number.slice(-2) : number;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function displayName(authority: Pick<DegreeGeneralAuthority, 'staff' | 'professional_prefix'>): string {
  const prefix = authority.professional_prefix?.label;

  return prefix ? `${prefix} ${authority.staff.full_name}` : authority.staff.full_name;
}

const SNAPSHOT_LABELS: Record<CoreSnapshotStatus, string> = {
  fresh: 'Vigente',
  expiring: 'Por vencer',
  expired: 'Vencida',
  missing: 'Sin sincronizar',
  outdated: 'Desactualizada',
};

/** Texto del estado de la copia de CORE. */
export function snapshotLabel(status: CoreSnapshotStatus | undefined): string {
  return status ? SNAPSHOT_LABELS[status] : SNAPSHOT_LABELS.missing;
}

export function snapshotSeverity(status: CoreSnapshotStatus | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  switch (status) {
    case 'fresh': return 'success';
    case 'expiring': return 'warn';
    case 'expired':
    case 'outdated': return 'danger';
    default: return 'secondary';
  }
}

/** Una copia vencida, sin sincronizar o desactualizada pide actualizar o continuar bajo responsabilidad. */
export function isStaleSnapshot(status: CoreSnapshotStatus | undefined): boolean {
  return status === 'expired' || status === 'missing' || status === 'outdated';
}

const FIELD_LABELS: Record<string, string> = {
  academic_title: 'Grado/Título académico',
  professional_prefix_id: 'Prefijo profesional',
  email: 'Correo institucional',
  phone: 'Teléfono',
};

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

export function changeValue(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

export function sourceLabel(source: CoreFieldSource | undefined): string {
  return source === 'core' ? 'Core' : source === 'manual' ? 'Manual' : 'Sin dato';
}

/** El correo manual debe pertenecer al dominio institucional (el servidor lo vuelve a validar). */
export const INSTITUTIONAL_EMAIL_DOMAIN = 'unadqtc.edu.pe';

export function isInstitutionalEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@' + INSTITUTIONAL_EMAIL_DOMAIN) && /^[^\s@]+@[^\s@]+$/.test(email.trim());
}

/** Datos de la designación que aún no existen: son los únicos que se pueden completar después de guardar. */
export function missingResolvedFields(
  authority: Pick<DegreeGeneralAuthority, 'professional_prefix' | 'academic_title' | 'email' | 'phone'>,
): CoreResolvedField[] {
  const missing: CoreResolvedField[] = [];
  if (!authority.professional_prefix) missing.push('professional_prefix_id');
  if (!authority.academic_title?.trim()) missing.push('academic_title');
  if (!authority.email?.trim()) missing.push('email');
  if (!authority.phone?.trim()) missing.push('phone');

  return missing;
}

const AUDIT_LABELS: Record<DegreeGeneralAuthorityAuditAction, string> = {
  designated: 'Designación',
  manual_completed: 'Datos completados',
  synced_from_core: 'Actualizado desde Core',
  stale_acknowledged: 'Continuó con datos vencidos',
};

export function auditLabel(action: DegreeGeneralAuthorityAuditAction): string {
  return AUDIT_LABELS[action] ?? action;
}

export function auditSeverity(action: DegreeGeneralAuthorityAuditAction): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  switch (action) {
    case 'designated': return 'success';
    case 'synced_from_core': return 'info';
    case 'manual_completed': return 'warn';
    case 'stale_acknowledged': return 'danger';
    default: return 'secondary';
  }
}

/** Días que faltan para el vencimiento (0 si ya venció o no hay fecha). */
export function daysUntil(expiresAt: string | null | undefined, now: Date = new Date()): number {
  if (!expiresAt) {
    return 0;
  }
  const days = Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 86_400_000);

  return Math.max(days, 0);
}

/** Porcentaje de la vigencia que queda, entre 0 y 100 (para la barra de progreso). */
export function vigencyPercent(syncedAt: string | null | undefined, expiresAt: string | null | undefined, now: Date = new Date()): number {
  if (!syncedAt || !expiresAt) {
    return 0;
  }
  const total = new Date(expiresAt).getTime() - new Date(syncedAt).getTime();
  const left = new Date(expiresAt).getTime() - now.getTime();

  return total <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((left / total) * 100)));
}

/** Color de la barra de vigencia según el estado de la copia. */
export function vigencyColor(status: CoreSnapshotStatus | undefined): string {
  switch (status) {
    case 'fresh': return '#16a34a';
    case 'expiring': return '#d97706';
    default: return '#dc2626';
  }
}
