import type {LucideIcon, LucideIconData} from '@lucide/angular';
import {
  LucideCalendarCheck,
  LucideCalendarDays,
  LucideChartColumn,
  LucideChevronDown,
  LucideChevronRight,
  LucideChevronsRight,
  LucideCircle,
  LucideCircleAlert,
  LucideCloudDownload,
  LucideDownload,
  LucideFile,
  LucideFileText,
  LucideFingerprint,
  LucideHand,
  LucideHouse,
  LucideIdCard,
  LucideLoaderCircle,
  LucideLock,
  LucideLogOut,
  LucideMapPin,
  LucideScanFace,
  LucideTrophy,
  LucideUpload,
  LucideUser,
  LucideUsers,
} from '@lucide/angular';

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  calendar: LucideCalendarDays,
  'calendar-check': LucideCalendarCheck,
  card: LucideIdCard,
  'chart-column': LucideChartColumn,
  'chevron-down': LucideChevronDown,
  'chevron-right': LucideChevronRight,
  'chevrons-right': LucideChevronsRight,
  circle: LucideCircle,
  'circle-alert': LucideCircleAlert,
  'cloud-download': LucideCloudDownload,
  download: LucideDownload,
  file: LucideFile,
  'file-text': LucideFileText,
  fingerprint: LucideFingerprint,
  hand: LucideHand,
  home: LucideHouse,
  house: LucideHouse,
  'id-card': LucideIdCard,
  'loader-circle': LucideLoaderCircle,
  lock: LucideLock,
  logout: LucideLogOut,
  'log-out': LucideLogOut,
  'map-pin': LucideMapPin,
  ranking: LucideTrophy,
  report: LucideChartColumn,
  reports: LucideChartColumn,
  'scan-face': LucideScanFace,
  trophy: LucideTrophy,
  upload: LucideUpload,
  user: LucideUser,
  users: LucideUsers,
};

const FONT_AWESOME_ALIASES: Record<string, string> = {
  'fa-arrow-up-from-bracket': 'upload',
  'fa-calendar-days': 'calendar',
  'fa-calendar-check': 'calendar-check',
  'fa-chart-column': 'report',
  'fa-circle': 'circle',
  'fa-circle-exclamation': 'circle-alert',
  'fa-cloud-arrow-down': 'cloud-download',
  'fa-download': 'download',
  'fa-face-smile': 'scan-face',
  'fa-file': 'file',
  'fa-file-lines': 'file-text',
  'fa-fingerprint': 'fingerprint',
  'fa-hand': 'hand',
  'fa-house': 'house',
  'fa-id-card': 'id-card',
  'fa-location-dot': 'map-pin',
  'fa-lock': 'lock',
  'fa-ranking-star': 'ranking',
  'fa-right-from-bracket': 'log-out',
  'fa-user': 'user',
  'fa-users': 'users',
};

export function getLucideIconData(icon?: string): LucideIconData {
  return getLucideIcon(icon).icon;
}

function getLucideIcon(icon?: string): LucideIcon {
  const normalizedIcon = icon?.trim().toLowerCase();

  if (!normalizedIcon) {
    return LucideCircle;
  }

  const alias = normalizedIcon
    .split(/\s+/)
    .find((iconClass) => FONT_AWESOME_ALIASES[iconClass]);

  if (alias) {
    return LUCIDE_ICONS[FONT_AWESOME_ALIASES[alias]] ?? LucideCircle;
  }

  return LUCIDE_ICONS[normalizedIcon] ?? LucideCircle;
}
