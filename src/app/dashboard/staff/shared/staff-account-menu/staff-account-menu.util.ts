import {MenuItem} from 'primeng/api';

export function buildStaffAccountMenu(
  openChangePasswordDialog: () => void,
  logout: () => void,
): MenuItem {
  return {
    label: 'Mi cuenta',
    icon: 'fa-solid fa-fingerprint',
    items: [
      {
        label: 'Cambiar contraseña',
        icon: 'fa-solid fa-lock',
        command: openChangePasswordDialog,
      },
      {
        label: 'Cerrar Sesión',
        icon: 'fa-solid fa-right-from-bracket',
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
    icon: 'fa-solid fa-calendar-check',
    routerLink,
  };
}

export function prependStaffCommonMenu(items: MenuItem[], accountMenu: MenuItem, attendanceMenu: MenuItem): MenuItem[] {
  const reservedLabels = new Set(['mi cuenta', 'mis asistencias']);

  return [
    accountMenu,
    attendanceMenu,
    ...items.filter((item) => !reservedLabels.has(item.label?.trim().toLowerCase() ?? '')),
  ];
}
