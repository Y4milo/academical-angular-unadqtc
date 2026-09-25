import {CoreAcademicStudentCandidate, DegreeAcademicCareer, DegreeAcademicDenomination, DegreeStudentCandidate} from '../../../services/degrees-titles.service';

export function resolveDegreeDenomination(
  denomination: DegreeAcademicDenomination | null,
  gender: 'M' | 'F' | null,
  historicalSnapshot: string | null = null,
): string {
  if (historicalSnapshot) return historicalSnapshot;
  if (!denomination) return '';
  if (gender === 'M') return denomination.denomination_male || denomination.label;
  if (gender === 'F') return denomination.denomination_female || denomination.label;
  return denomination.label;
}

export function denominationForDegreeType(
  career: DegreeAcademicCareer | null,
  degreeTypeId: number | null,
): DegreeAcademicDenomination | null {
  return career?.denominations.find(option => option.degree_type_id === degreeTypeId) ?? null;
}

/**
 * Whether the academic profile itself already resolved a valid gender for the selected
 * candidate. When true, the manual "Sexo del estudiante" selector must be hidden — the
 * profile is authoritative and the operator cannot substitute it (matches the backend,
 * which ignores an operator-submitted gender whenever the profile already resolves one).
 */
export function isProfileGenderResolved(hasSelectedStudent: boolean, resolvedGender: 'M' | 'F' | null): boolean {
  return hasSelectedStudent && (resolvedGender === 'M' || resolvedGender === 'F');
}

export function resolvedGenderLabel(gender: 'M' | 'F' | null): string {
  return gender === 'F' ? 'Femenino' : gender === 'M' ? 'Masculino' : '';
}

export type InstitutionalIdentityDisplayStatus =
  | 'verified' | 'confirmed' | 'probable' | 'review_required'
  | 'not_match' | 'not_found' | 'invalid_domain' | 'pending' | 'technical_error';

/**
 * A Microsoft 365 technical failure (timeout, connection error, 5xx) is stored as
 * `status: 'pending'` with an `error_code` set, by deliberate backend design — so that a
 * temporary outage is never read as "the account does not exist". This is where that gets
 * unpacked into a status the UI can show as its own distinct, differentiated state.
 */
/**
 * Third line of a CORE candidate card: Facultad · Carrera · Especialidad, dropping any
 * dimension the profile doesn't have instead of rendering "null"/"-" or a trailing "·".
 */
export function coreCandidateAcademicLine(
  candidate: Pick<CoreAcademicStudentCandidate, 'faculty' | 'major' | 'specialization'>,
): string {
  return [candidate.faculty?.label, candidate.major?.label, candidate.specialization?.label]
    .filter((label): label is string => !!label)
    .join(' · ');
}

/** Second line: "DNI 72718179 · Código 222102" (real document-type label, never the raw lowercase code alone). */
export function coreCandidateDocumentLine(
  candidate: Pick<CoreAcademicStudentCandidate, 'document_type' | 'document_number' | 'code'>,
): string {
  const type = candidate.document_type ? candidate.document_type.toUpperCase() : 'Documento';

  return `${type} ${candidate.document_number} · Código ${candidate.code}`;
}

export function institutionalIdentityDisplayStatus(
  email: Pick<DegreeStudentCandidate['institutional_email'], 'status' | 'error_code'> | null | undefined,
): InstitutionalIdentityDisplayStatus {
  const status = (email?.status ?? 'pending') as InstitutionalIdentityDisplayStatus;
  if (status === 'pending' && email?.error_code) return 'technical_error';

  return status;
}
