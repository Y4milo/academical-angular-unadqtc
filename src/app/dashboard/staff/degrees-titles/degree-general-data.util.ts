import {CoreFieldSource, CoreSnapshotStatus, DegreeGeneralAuthority, DegreeGeneralAuthorityRoleKey} from '../../../services/degrees-titles.service';

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
