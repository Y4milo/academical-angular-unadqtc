import {PATHS} from '../../paths';

const academicPrivileges = [
  {
    label: 'Asistencias',
    icon: 'fingerprint',
    routerLink: PATHS.academic.home.path
  },
  {
    label: 'Alumnos',
    icon: 'fingerprint',
    items: [
      {
        label: 'Carnet Universitario',
        routerLink: PATHS.academic.student.card.panel.path
      },
      {
        label: 'Ranking Académico',
        routerLink: PATHS.academic.student.ranking.path
      },
    ]
  },
];
export default academicPrivileges;
