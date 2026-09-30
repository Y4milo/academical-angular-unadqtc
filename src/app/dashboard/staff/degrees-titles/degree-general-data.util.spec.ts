import {
  auditLabel, auditSeverity, changeValue, daysUntil, fieldLabel, isInstitutionalEmail, isStaleSnapshot, missingResolvedFields, snapshotLabel, snapshotSeverity,
  sourceLabel, tenureLabel, vigencyColor, vigencyPercent,
} from './degree-general-data.util';

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

  it('lists only the data that does not exist yet', () => {
    expect(missingResolvedFields({professional_prefix: null, academic_title: null, email: '', phone: null}))
      .toEqual(['professional_prefix_id', 'academic_title', 'email', 'phone']);
    expect(missingResolvedFields({professional_prefix: {id: 1, value: 'mg', label: 'Mg.'}, academic_title: 'Maestro', email: 'a@unadqtc.edu.pe', phone: ' '}))
      .toEqual(['phone']);
    expect(missingResolvedFields({professional_prefix: {id: 1, value: 'mg', label: 'Mg.'}, academic_title: 'Maestro', email: 'a@unadqtc.edu.pe', phone: '987654321'}))
      .toEqual([]);
  });

  it('labels the audit actions', () => {
    expect(auditLabel('designated')).toBe('Designación');
    expect(auditLabel('manual_completed')).toBe('Datos completados');
    expect(auditLabel('synced_from_core')).toBe('Actualizado desde Core');
    expect(auditLabel('stale_acknowledged')).toBe('Continuó con datos vencidos');
    expect(auditSeverity('stale_acknowledged')).toBe('danger');
    expect(auditSeverity('designated')).toBe('success');
  });

  it('computes the days and percentage of vigency left', () => {
    const now = new Date('2026-10-01T00:00:00Z');
    expect(daysUntil('2026-10-11T00:00:00Z', now)).toBe(10);
    expect(daysUntil('2026-09-01T00:00:00Z', now)).toBe(0);
    expect(daysUntil(null, now)).toBe(0);
    expect(vigencyPercent('2026-09-01T00:00:00Z', '2026-11-01T00:00:00Z', now)).toBeGreaterThan(40);
    expect(vigencyPercent('2026-09-01T00:00:00Z', '2026-09-20T00:00:00Z', now)).toBe(0);
    expect(vigencyPercent(null, null, now)).toBe(0);
  });

  it('colors the vigency bar by status', () => {
    expect(vigencyColor('fresh')).toBe('#16a34a');
    expect(vigencyColor('expiring')).toBe('#d97706');
    expect(vigencyColor('expired')).toBe('#dc2626');
  });

  it('describes how long a designation lasted', () => {
    const now = new Date('2026-10-01T00:00:00Z');
    expect(tenureLabel(null, null, now)).toBe('—');
    expect(tenureLabel('2026-10-01T00:00:00Z', null, now)).toBe('Menos de un día');
    expect(tenureLabel('2026-09-30T00:00:00Z', null, now)).toBe('1 día');
    expect(tenureLabel('2026-09-26T00:00:00Z', null, now)).toBe('5 días');
    expect(tenureLabel('2026-06-01T00:00:00Z', null, now)).toBe('4 meses');
    expect(tenureLabel('2025-07-20T00:00:00Z', null, now)).toBe('1 año 2 meses');
    expect(tenureLabel('2024-10-01T00:00:00Z', '2026-10-01T00:00:00Z')).toBe('2 años');
  });
});
