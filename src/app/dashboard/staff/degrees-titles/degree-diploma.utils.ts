import {DegreeAcademicDenomination} from '../../../services/degrees-titles.service';

export function resolveDegreeDenomination(
  denomination: DegreeAcademicDenomination | null,
  gender: 'M' | 'F' | null,
): string {
  if (!denomination) return '';
  if (gender === 'M') return denomination.denomination_male || denomination.label;
  if (gender === 'F') return denomination.denomination_female || denomination.label;
  return denomination.label;
}
