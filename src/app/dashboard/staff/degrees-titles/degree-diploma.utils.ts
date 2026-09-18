import {DegreeAcademicCareer, DegreeAcademicDenomination} from '../../../services/degrees-titles.service';

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
