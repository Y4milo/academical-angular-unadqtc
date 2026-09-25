import {
  coreCandidateAcademicLine,
  coreCandidateDocumentLine,
  denominationForDegreeType,
  institutionalIdentityDisplayStatus,
  isProfileGenderResolved,
  resolveDegreeDenomination,
  resolvedGenderLabel,
} from './degree-diploma.utils';
import {DegreeAcademicCareer, DegreeAcademicDenomination, DegreeStudentCandidate} from '../../../services/degrees-titles.service';

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

describe('isProfileGenderResolved / resolvedGenderLabel', () => {
  it('hides the selector and resolves the male denomination when the profile provides gender M', () => {
    expect(isProfileGenderResolved(true, 'M')).toBeTrue();
    expect(resolvedGenderLabel('M')).toBe('Masculino');
  });

  it('hides the selector and resolves the female denomination when the profile provides gender F', () => {
    expect(isProfileGenderResolved(true, 'F')).toBeTrue();
    expect(resolvedGenderLabel('F')).toBe('Femenino');
  });

  it('shows the selector as required when the profile cannot resolve a gender', () => {
    expect(isProfileGenderResolved(true, null)).toBeFalse();
    expect(resolvedGenderLabel(null)).toBe('');
  });

  it('shows the selector when no candidate is selected at all, regardless of a stale form value', () => {
    expect(isProfileGenderResolved(false, 'M')).toBeFalse();
  });
});

describe('coreCandidateAcademicLine', () => {
  const ref = (label: string): {code: string; value: string; label: string} => ({code: label, value: label, label});

  it('joins facultad, carrera and especialidad with a middle dot', () => {
    expect(coreCandidateAcademicLine({faculty: ref('Facultad de Arte'), major: ref('Artes Visuales'), specialization: ref('Dibujo y Pintura')}))
      .toBe('Facultad de Arte · Artes Visuales · Dibujo y Pintura');
  });

  it('omits specialization entirely instead of a trailing separator when it is null', () => {
    expect(coreCandidateAcademicLine({faculty: ref('Facultad de Educación'), major: ref('Educación Artística'), specialization: null}))
      .toBe('Facultad de Educación · Educación Artística');
  });

  it('never renders "null" or "-" for a missing dimension', () => {
    const line = coreCandidateAcademicLine({faculty: ref('Facultad de Arte'), major: null, specialization: null});
    expect(line).not.toContain('null');
    expect(line).not.toContain('-');
    expect(line).toBe('Facultad de Arte');
  });
});

describe('coreCandidateDocumentLine', () => {
  it('renders "DNI xxxxxxxx · Código xxxxxx" on one line', () => {
    expect(coreCandidateDocumentLine({document_type: 'dni', document_number: '72718179', code: '222102'}))
      .toBe('DNI 72718179 · Código 222102');
  });

  it('uppercases a non-DNI document type using its real code', () => {
    expect(coreCandidateDocumentLine({document_type: 'ce', document_number: '000123', code: '151165'}))
      .toBe('CE 000123 · Código 151165');
  });
});

describe('institutionalIdentityDisplayStatus', () => {
  const email = (overrides: Partial<DegreeStudentCandidate['institutional_email']>) =>
    ({core: null, candidate: null, verified: null, match_status: null, verified_at: null,
      status: null, checked_at: null, error_code: null, ...overrides}) as DegreeStudentCandidate['institutional_email'];

  it('reports verified as-is', () => expect(institutionalIdentityDisplayStatus(email({status: 'verified'}))).toBe('verified'));

  it('reports not_found as-is, distinct from a technical failure', () =>
    expect(institutionalIdentityDisplayStatus(email({status: 'not_found'}))).toBe('not_found'));

  it('reports a never-checked candidate as pending, not as a technical error', () =>
    expect(institutionalIdentityDisplayStatus(email({status: 'pending', error_code: null}))).toBe('pending'));

  it('reports a Microsoft outage as technical_error, never as not_found', () =>
    expect(institutionalIdentityDisplayStatus(email({status: 'pending', error_code: 'connection_error'}))).toBe('technical_error'));

  it('defaults to pending when no institutional_email data is present yet', () =>
    expect(institutionalIdentityDisplayStatus(null)).toBe('pending'));
});
