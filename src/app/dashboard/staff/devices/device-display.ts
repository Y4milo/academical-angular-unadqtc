import {BrandIconName} from '../../../core/components/brand-icon/brand-icon.paths';
import {BrowserSession} from '../../../services/devices.service';

/** The logo of each browser and system we can draw (without one, the screen shows a generic icon). The same as Core. */
const BROWSER_ICON: Record<string, BrandIconName> = {Chrome: 'chrome', Edge: 'edge', Firefox: 'firefox', Safari: 'safari', Opera: 'opera'};
const PLATFORM_ICON: Record<string, BrandIconName> = {Windows: 'windows', Linux: 'linux', Android: 'android', macOS: 'apple', iOS: 'apple'};

export function browserIcon(browser: string | null): BrandIconName {
  return BROWSER_ICON[browser ?? ''] ?? 'globe';
}

export function platformIcon(platform: string | null): BrandIconName {
  return PLATFORM_ICON[platform ?? ''] ?? 'help';
}

/** The title of the row: what kind of device it is («Este equipo» when it is the one in use). */
export function deviceTitle(session: Pick<BrowserSession, 'device_type' | 'current'>): string {
  const kinds = {
    desktop: {name: 'Computador', current: 'Este equipo'},
    mobile: {name: 'Celular', current: 'Este celular'},
    tablet: {name: 'Tableta', current: 'Esta tableta'},
  } as const;
  const kind = kinds[session.device_type] ?? kinds.desktop;

  return session.current ? kind.current : kind.name;
}

/** What a screen reader reads for the row, since the logos are decorative: «Chrome en Windows». */
export function deviceSummary(session: Pick<BrowserSession, 'browser' | 'platform'>): string {
  return `${session.browser || 'Navegador desconocido'} en ${session.platform || 'sistema desconocido'}`;
}

/** The Lucide icon of the kind of device. */
export function deviceIcon(session: Pick<BrowserSession, 'device_type'>): string {
  return session.device_type === 'mobile' ? 'smartphone' : session.device_type === 'tablet' ? 'tablet' : 'laptop';
}
