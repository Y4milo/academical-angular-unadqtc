import {denominationForDegreeType, resolveDegreeDenomination} from './degree-diploma.utils';
import {DegreeAcademicCareer, DegreeAcademicDenomination} from '../../../services/degrees-titles.service';

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
  it('keeps the saved snapshot when reopening a record', () => expect(resolveDegreeDenomination(denomination, 'F', 'Denominación histórica')).toBe('Denominación histórica'));
});

describe('denominationForDegreeType', () => {
  const career = {
    denominations: [
      {id: 1, degree_type_id: 10, label: 'Bachiller en Educación Artística'},
      {id: 2, degree_type_id: 20, label: 'Licenciado en Educación Artística'},
    ],
  } as DegreeAcademicCareer;

  it('updates the denomination when the degree type changes', () => {
    expect(denominationForDegreeType(career, 10)?.id).toBe(1);
    expect(denominationForDegreeType(career, 20)?.id).toBe(2);
  });

  it('clears the denomination when the career changes to one without that degree type', () => {
    expect(denominationForDegreeType({...career, denominations: []}, 20)).toBeNull();
  });
});
