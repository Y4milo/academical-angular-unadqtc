import {MenuItem} from 'primeng/api';

/**
 * Builds the sidebar groups from what the API sends, with the group that holds the current screen expanded.
 * PrimeNG draws its own link for a top-level item that has a route, so a screen outside a group (the staff user's
 * own attendance) is not part of this model: the layout draws it above the menu.
 */
export function buildStaffMenu(groups: MenuItem[], currentUrl: string): MenuItem[] {
  return groups
    .filter((group) => group.items?.length)
    .map((group) => ({...group, expanded: holdsUrl(group, currentUrl)}));
}

/** Whether a screen of the group (or the item itself) is the one being shown. */
export function holdsUrl(item: MenuItem, currentUrl: string): boolean {
  if (typeof item.routerLink === 'string' && matchesUrl(item.routerLink, currentUrl)) {
    return true;
  }

  return (item.items ?? []).some((child) => holdsUrl(child, currentUrl));
}

function matchesUrl(link: string, currentUrl: string): boolean {
  const path = currentUrl.split(/[?#]/)[0];

  return path === link || path.startsWith(`${link}/`);
}

/** Initials for the avatar of the signed-in person: first letter of the first two words. */
export function initialsOf(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);

  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('');
}
