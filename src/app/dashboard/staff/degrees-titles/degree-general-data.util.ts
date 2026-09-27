import {DegreeGeneralAuthority, DegreeGeneralAuthorityRoleKey} from '../../../services/degrees-titles.service';

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
