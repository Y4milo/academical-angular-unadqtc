import {resolveDegreeDenomination} from './degree-diploma.utils';
import {DegreeAcademicDenomination} from '../../../services/degrees-titles.service';

describe('resolveDegreeDenomination', () => {
  const denomination = {
    id: 1,
    code: 'TP-EA',
    label: 'Licenciado en Educación Artística',
    degree_type_id: 2,
    degree_type_code: 'professional_title',
    specialty_required: false,
    denomination_male: 'Licenciado en Educación Artística',
    denomination_female: 'Licenciada en Educación Artística',
  } as DegreeAcademicDenomination;

  it('uses the male denomination', () => expect(resolveDegreeDenomination(denomination, 'M')).toBe('Licenciado en Educación Artística'));
  it('uses the female denomination', () => expect(resolveDegreeDenomination(denomination, 'F')).toBe('Licenciada en Educación Artística'));
  it('falls back to the general label', () => expect(resolveDegreeDenomination({...denomination, denomination_female: null}, 'F')).toBe(denomination.label));
});
