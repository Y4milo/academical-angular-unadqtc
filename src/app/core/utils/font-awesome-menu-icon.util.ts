const MENU_ICON_CLASSES: Record<string, string> = {
  calendar: 'fa-solid fa-calendar-days',
  'calendar-check': 'fa-solid fa-calendar-check',
  card: 'fa-solid fa-id-card',
  file: 'fa-solid fa-file',
  'file-text': 'fa-solid fa-file-lines',
  fingerprint: 'fa-solid fa-fingerprint',
  home: 'fa-solid fa-house',
  house: 'fa-solid fa-house',
  'id-card': 'fa-solid fa-id-card',
  lock: 'fa-solid fa-lock',
  logout: 'fa-solid fa-right-from-bracket',
  ranking: 'fa-solid fa-ranking-star',
  report: 'fa-solid fa-chart-column',
  reports: 'fa-solid fa-chart-column',
  user: 'fa-solid fa-user',
  users: 'fa-solid fa-users',
};

export function getFontAwesomeMenuIcon(icon?: string): string {
  const normalizedIcon = icon?.trim().toLowerCase();

  if (!normalizedIcon) {
    return '';
  }

  if (normalizedIcon.includes('fa-')) {
    return icon!.trim();
  }

  return MENU_ICON_CLASSES[normalizedIcon] ?? 'fa-solid fa-circle';
}
