import {PATHS} from '../../paths';

const humanResourcesPrivileges = [
  {
    label: 'Consultas RH',
    items: [
      {
        label: 'Asistencias del personal',
        routerLink: PATHS.hr.staff.attendance.list.path
      },
      {
        label: 'Reportes',
        routerLink: PATHS.hr.staff.attendance.reports.path
      },
    ]
  },
]

export default humanResourcesPrivileges;
