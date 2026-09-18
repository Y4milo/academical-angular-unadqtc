import {denominationForDegreeType, resolveDegreeDenomination} from './degree-diploma.utils';
import {DegreeAcademicCareer, DegreeAcademicDenomination} from '../../../services/degrees-titles.service';

describe('resolveDegreeDenomination', () => {
  const denomination = {
    id: 1,
    code: 'TP-AV',
    label: 'Licenciado en Artes Visuales',
    degree_type_id: 2,
    degree_type_code: 'professional_title',
    specialty_required: false,
    denomination_male: 'Licenciado en Artes Visuales',
    denomination_female: 'Licenciada en Artes Visuales',
  } as DegreeAcademicDenomination;

  it('uses the male Arts denomination', () => expect(resolveDegreeDenomination(denomination, 'M')).toBe('Licenciado en Artes Visuales'));
  it('uses the female Arts denomination', () => expect(resolveDegreeDenomination(denomination, 'F')).toBe('Licenciada en Artes Visuales'));
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

  it('resolves the female variant after changing careers', () => {
    const artsCareer = {
      ...career,
      denominations: [{
        id: 3,
        degree_type_id: 20,
        label: 'Licenciado en Artes Visuales',
        denomination_male: 'Licenciado en Artes Visuales',
        denomination_female: 'Licenciada en Artes Visuales',
      }],
    } as DegreeAcademicCareer;

    expect(resolveDegreeDenomination(denominationForDegreeType(artsCareer, 20), 'F'))
      .toBe('Licenciada en Artes Visuales');
  });
});
