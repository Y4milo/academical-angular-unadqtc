import {MenuItem} from 'primeng/api';
import {buildStaffMenu, holdsUrl, initialsOf} from './staff-menu.util';

const GROUPS: MenuItem[] = [
  {label: 'Recursos humanos', icon: 'users', items: [
    {label: 'Asistencias del personal', routerLink: '/hr/staff/attendance'},
    {label: 'Reportes', routerLink: '/hr/staff/reports'},
  ]},
  {label: 'Académico', icon: 'school', items: [
    {label: 'Ranking académico', routerLink: '/hr/student/ranking'},
  ]},
];

describe('staff menu util', () => {
  it('keeps the groups in the order the API sends them', () => {
    expect(buildStaffMenu(GROUPS, '/').map(item => item.label)).toEqual(['Recursos humanos', 'Académico']);
  });

  it('drops a group with no screens', () => {
    expect(buildStaffMenu([...GROUPS, {label: 'Vacío', items: []}], '/').length).toBe(2);
  });

  it('expands only the group that holds the current screen, also on a child path or with a query', () => {
    const menu = buildStaffMenu(GROUPS, '/hr/staff/reports?month=10');

    expect(menu.map(item => item.expanded)).toEqual([true, false]);
    expect(holdsUrl(GROUPS[0], '/hr/staff/attendance/register')).toBeTrue();
    expect(holdsUrl(GROUPS[0], '/hr/staff/attendances')).toBeFalse();
  });

  it('does not change the groups it receives', () => {
    buildStaffMenu(GROUPS, '/hr/staff/reports');

    expect(GROUPS[0].expanded).toBeUndefined();
  });

  it('builds the initials of the first two words', () => {
    expect(initialsOf('yamil alberto pérez')).toBe('YA');
    expect(initialsOf('  ')).toBe('');
    expect(initialsOf(null)).toBe('');
  });
});
