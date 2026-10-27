import { buildStudentMenu } from './student-menu.store';

describe('buildStudentMenu', () => {
  it('builds one group with the modules that have a screen', () => {
    const menu = buildStudentMenu([
      { key: 'carnet', label: 'Carné universitario', state: 'open', message: null },
      { key: 'dbu_appointments', label: 'Citas de Bienestar', state: 'open', message: null },
    ]);

    expect(menu.length).toBe(1);
    expect(menu[0].label).toBe('Mis trámites');
    expect(menu[0].items?.map(item => item.label)).toEqual(['Carné universitario']);
    expect(menu[0].items?.[0].routerLink).toBe('/student/card/registration');
  });

  it('returns no group when there is nothing to show', () => {
    expect(buildStudentMenu([])).toEqual([]);
    expect(buildStudentMenu([{ key: 'dbu_appointments', label: 'Citas', state: 'open', message: null }])).toEqual([]);
  });
});
