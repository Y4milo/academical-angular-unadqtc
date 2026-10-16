# Frontend components strategy (Academical)

Academical uses Angular 19, PrimeNG 19 (Aura theme) and Lucide icons. The rule is to keep the code simple: use PrimeNG components directly in the pages and unify the look with the theme tokens, not with wrapper components.

## The catalog is the source of truth

The page **Catálogo de componentes** (`/admin/components`, `src/app/dashboard/staff/shared/components-catalog`) is the source of truth of the interface, the same idea as Core and Events. Rules:

1. Before building a screen, check the catalog and reuse its pieces.
2. Every new or changed reusable pattern (dialogs, tabs, lists, stacked tables, states, status colors) is added to the catalog **in the same change**, with its states: normal, loading, empty, error, light and dark theme, and phone width.
3. PrimeNG components only. What PrimeNG does not cover is documented in the catalog with the closest composition.
4. Tests and a script enforce it (see below).

## What enforces each rule

| Check | What it prevents |
|---|---|
| `components-catalog.component.spec.ts` | A catalog section disappearing; a theme token that is missing or does not change between light and dark |
| `npm run check:theme` (`scripts/check-theme-tokens.mjs`) | CSS or templates using the old PrimeNG names (`--surface-card`, `--surface-border`, `--text-color-secondary`...) with a hard light fallback, or fixed palettes (`--p-surface-N`, `--p-primary-N`) as backgrounds or text. Old files have a cap in `scripts/theme-tokens-baseline.json` that can only go down; new or touched files must be at zero |
| Component specs with `autoDetectChanges` + `whenStable` | A screen that never settles (for example a value that is a new object on every change detection) |

## Light and dark theme

The theme is decided only by the `app-dark` class on `<html>` (PrimeNG uses `darkModeSelector: '.app-dark'`). Never use `@media (prefers-color-scheme: dark)` in component CSS.

This project only loads the Aura theme from `@primeng/themes`. Its variables are `--p-*`. The PrimeNG 17 names (`--surface-card`, `--surface-border`, `--surface-ground`, `--text-color`, `--text-color-secondary`, `--primary-color`) **do not exist**: `var(--surface-card, #fff)` always falls to the light fallback, so in dark mode a card stays white. The palettes `--p-surface-0..950` and `--p-primary-50..950` are fixed and do not change with the theme either.

| Need | Token |
|---|---|
| Card, panel, dialog background | `--p-content-background` |
| Hover and soft blocks inside a card | `--p-content-hover-background` |
| Border and separators | `--p-content-border-color` |
| Text / muted text | `--p-text-color` / `--p-text-muted-color` |
| Highlighted cell, row or chip | `--p-highlight-background` + `--p-highlight-color` |
| Brand | `--p-primary-color` (text on it: `--p-primary-contrast-color`) |
| States | `p-tag` or `p-message` with a `severity`; if CSS is needed, `--p-green-500`, `--p-orange-500`, `--p-red-500` |

Old screens (bank, attendance) still use chains like `var(--surface-card, var(--p-content-background, #fff))`: they work because they fall into a `--p-*` token, but they are not copied. The failure is the hard fallback.

To check a screen: toggle the theme with `document.documentElement.classList.toggle('app-dark', true|false)` in the browser, read `getComputedStyle(el).backgroundColor` and `.color` of each block in both themes, and look at cards, rows, highlighted cells, tags, messages, dialogs and overlays (`appendTo="body"` panels live outside the card).

## Sizes and spacing

- Spacing: `--space-1..6` (4, 8, 12, 16, 24, 32 px). Text: 0.75, 0.8, 0.85, 1, 1.125 and 1.5 rem. Weights 400 and 600.
- Breakpoints: 640 px (phone), 900 px (tablet), 1200 px (desktop). Phone first.
- Check every screen at **375, 768 and 1440 px, in both themes**, with no horizontal page scroll (`scrollWidth === innerWidth`) and nothing outside its card.
- A container separates its children with one `gap`. A form row is `display: flex; flex-wrap: wrap`; never `flex-direction: column` together with a `flex-basis` in `rem` (the basis becomes a height and leaves a huge empty block on phones).
- Phone spacing: below 640 px the page, panels and rows use less padding; the loading skeleton must not be taller than what it replaces.
- Section menus: a vertical list on desktop; below 900 px a single row that slides, so the content is not pushed down.
- Text tables: below 640 px each row is a label/value card (`data-label` on every `td`, `styleClass="dbu-stack"` as the reference). Dense numeric tables keep a horizontal scroll inside their container.

## Sidebar menu

The staff menu is a `p-panelmenu` in a 17 rem column (`p-drawer` below 900 px) rendered by `staff-role-layout`. Two levels at most: group (module) and screen; one group open at a time, the group of the current screen expanded, the active screen highlighted with `--p-highlight-background`. The person, "Cambiar contraseña" and "Cerrar sesión" sit at the bottom. Loading shows `p-skeleton`; a failure shows a `p-message` with a retry button.

The entries come from the API (`RoleMenus.php` in the backend, one block per module written once and shown with the `/admin/...` routes to the administrator and with its own routes to the module role). The front never adds entries by hand. `StaffMenuStore` loads the menu once per session and forgets it on sign out. New icons are registered in `lucide-icon.util.ts`.

## Routes grouped by module

Every module hangs from its own path, public pages included: Bienestar Universitario lives under `/dbu` (`/dbu/citas`, `/dbu/citas/estado`, `/dbu/config`) and the admin copy under `/admin/dbu/...`. Paths are declared once in `src/app/core/constants/app-paths.constants.ts` (`PATHS`) and used by the routes and by the links in templates (`readonly links = ...`), never typed by hand. When a link is renamed, the old one stays as a `redirectTo`.

## Statuses

`STATE_SEVERITY` and `DBU_STATUS_VIEW` (`src/app/shared/ui/ui-tokens.ts`) map each state to its `p-tag` severity: ok = success, info, pending = warn, failed = danger, neutral = secondary. The same state has the same color everywhere (a cancelled appointment is neutral, a no-show is failed).

## Checklist before finishing a screen

Labels tied to their field, `aria-label` on icon-only buttons, logical focus order, contrast in light and dark, 375 / 768 / 1440 px without overflow, actions reachable by keyboard, dialogs closing with Esc, the three states (loading, empty, error), a spec that renders the screen and settles, and the catalog updated.
