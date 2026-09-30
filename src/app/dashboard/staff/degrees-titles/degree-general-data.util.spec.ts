import {changeValue, fieldLabel, isInstitutionalEmail, isStaleSnapshot, snapshotLabel, snapshotSeverity, sourceLabel} from './degree-general-data.util';

describe('degree-general-data.util (copia de CORE)', () => {
  it('describes each snapshot status', () => {
    expect(snapshotLabel('fresh')).toBe('Vigente');
    expect(snapshotLabel('expiring')).toBe('Por vencer');
    expect(snapshotLabel('expired')).toBe('Vencida');
    expect(snapshotLabel('outdated')).toBe('Desactualizada');
    expect(snapshotLabel(undefined)).toBe('Sin sincronizar');
    expect(snapshotSeverity('fresh')).toBe('success');
    expect(snapshotSeverity('expiring')).toBe('warn');
    expect(snapshotSeverity('expired')).toBe('danger');
  });

  it('flags only expired, missing and outdated snapshots as stale', () => {
    expect(isStaleSnapshot('fresh')).toBeFalse();
    expect(isStaleSnapshot('expiring')).toBeFalse();
    expect(isStaleSnapshot('expired')).toBeTrue();
    expect(isStaleSnapshot('missing')).toBeTrue();
    expect(isStaleSnapshot('outdated')).toBeTrue();
  });

  it('labels the source of each field', () => {
    expect(sourceLabel('core')).toBe('Core');
    expect(sourceLabel('manual')).toBe('Manual');
    expect(sourceLabel(null)).toBe('Sin dato');
  });

  it('accepts only institutional emails', () => {
    expect(isInstitutionalEmail('jperez@unadqtc.edu.pe')).toBeTrue();
    expect(isInstitutionalEmail(' JPerez@UNADQTC.edu.pe ')).toBeTrue();
    expect(isInstitutionalEmail('jperez@gmail.com')).toBeFalse();
    expect(isInstitutionalEmail('@unadqtc.edu.pe')).toBeFalse();
  });

  it('formats changed values and field names', () => {
    expect(changeValue(null)).toBe('—');
    expect(changeValue('911111111')).toBe('911111111');
    expect(fieldLabel('phone')).toBe('Teléfono');
    expect(fieldLabel('unknown')).toBe('unknown');
  });
});
