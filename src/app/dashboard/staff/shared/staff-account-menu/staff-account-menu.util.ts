import {MenuItem} from 'primeng/api';

export function buildStaffAccountMenu(
  openChangePasswordDialog: () => void,
  logout: () => void,
): MenuItem {
  return {
    label: 'Mi cuenta',
    icon: 'fingerprint',
    items: [
      {
        label: 'Cambiar contraseña',
        icon: 'lock',
        command: openChangePasswordDialog,
      },
      {
        label: 'Cerrar Sesión',
        icon: 'log-out',
        command: logout,
      },
    ],
  };
}

export function prependStaffAccountMenu(items: MenuItem[], accountMenu: MenuItem): MenuItem[] {
  return [
    accountMenu,
    ...items.filter((item) => item.label?.trim().toLowerCase() !== 'mi cuenta'),
  ];
}

export function buildStaffAttendanceMenu(routerLink: string): MenuItem {
  return {
    label: 'Mis asistencias',
    icon: 'calendar-check',
    routerLink,
  };
}

export function prependStaffCommonMenu(items: MenuItem[], accountMenu: MenuItem, attendanceMenu?: MenuItem): MenuItem[] {
  const reservedLabels = new Set(['mi cuenta', 'mis asistencias']);
  const sharedItems = attendanceMenu ? [accountMenu, attendanceMenu] : [accountMenu];

  return [
    ...sharedItems,
    ...items.filter((item) => !reservedLabels.has(item.label?.trim().toLowerCase() ?? '')),
  ];
}
