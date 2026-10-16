/**
 * Design tokens of Academical, in one place. The catalog (`/admin/components`) shows them live and its spec checks them.
 * PrimeNG 19 + Aura only defines `--p-*` variables: the old names (`--surface-card`, `--text-color-secondary`...) do not
 * exist, and the `--p-surface-N` / `--p-primary-N` palettes are fixed (they do not change with the theme).
 */

export interface ThemeToken {
  /** CSS custom property. */
  name: string;
  /** What it is for. */
  use: string;
  /** True when its value must be different in the light and the dark theme. */
  followsTheme: boolean;
}

export const THEME_TOKENS: readonly ThemeToken[] = [
  { name: '--p-content-background', use: 'Fondo de tarjeta, panel y diálogo', followsTheme: true },
  { name: '--p-content-hover-background', use: 'Fondo al pasar el mouse y bloques suaves dentro de una tarjeta', followsTheme: true },
  { name: '--p-content-border-color', use: 'Borde y separadores', followsTheme: true },
  { name: '--p-text-color', use: 'Texto normal', followsTheme: true },
  { name: '--p-text-muted-color', use: 'Texto apagado y ayudas', followsTheme: true },
  { name: '--p-highlight-background', use: 'Elemento destacado (celda, fila o chip resaltado)', followsTheme: true },
  { name: '--p-highlight-color', use: 'Texto sobre un elemento destacado', followsTheme: true },
  { name: '--p-primary-color', use: 'Color de marca (enlaces, acento)', followsTheme: true },
  { name: '--p-primary-contrast-color', use: 'Texto sobre el color de marca', followsTheme: true },
  { name: '--p-red-500', use: 'Rojo de estado fallido (si hace falta CSS; mejor `p-tag`/`p-message`)', followsTheme: false },
  { name: '--p-green-500', use: 'Verde de estado correcto (si hace falta CSS)', followsTheme: false },
  { name: '--p-orange-500', use: 'Naranja de aviso (si hace falta CSS)', followsTheme: false },
];

/** Names that look like theme tokens but do not exist (or do not change) in this project. */
export const FORBIDDEN_TOKENS: readonly string[] = [
  '--surface-card', '--surface-border', '--surface-ground', '--surface-section', '--text-color', '--text-color-secondary', '--primary-color',
  '--p-surface-0..950 (fixed palette)', '--p-primary-50..950 (fixed palette)',
];

export const SPACE_SCALE = [
  { token: '--space-1', px: 4 },
  { token: '--space-2', px: 8 },
  { token: '--space-3', px: 12 },
  { token: '--space-4', px: 16 },
  { token: '--space-5', px: 24 },
  { token: '--space-6', px: 32 },
] as const;

/** Breakpoints cannot be CSS variables inside media queries; they are fixed here and in the docs. */
export const BREAKPOINTS = [
  { name: 'Teléfono', max: 640 },
  { name: 'Tableta', max: 900 },
  { name: 'Escritorio', max: 1200 },
] as const;

export interface TypographyToken {
  name: string;
  /** CSS custom property declared once in `src/styles.css`. */
  token: string;
  use: string;
  /** Declared value the token must have (weights only). */
  expected?: string;
}

/** Text sizes. Same scale as the sidebar menu; a screen never writes its own `font-size`. */
export const TYPE_SCALE: readonly TypographyToken[] = [
  { name: 'Título de página', token: '--text-title', use: 'h1 y encabezado de cada pantalla' },
  { name: 'Título de panel', token: '--text-card-title', use: 'h2, h3, título de tarjeta y de diálogo' },
  { name: 'Cuerpo', token: '--text-body', use: 'Texto, campos, elementos del menú y filas de tabla' },
  { name: 'Ayuda y etiqueta de campo', token: '--text-small', use: 'Metadatos, ayudas, errores, tags y cabeceras de tabla' },
  { name: 'Leyenda', token: '--text-label', use: 'Subtítulo de la marca y notas mínimas' },
];

/** Only three weights: regular text, strong (active, button, header, label, tag) and title (page title, brand). */
export const WEIGHT_SCALE: readonly TypographyToken[] = [
  { name: 'Texto', token: '--weight-regular', use: 'Todo el texto normal', expected: '400' },
  { name: 'Énfasis', token: '--weight-strong', use: 'Elemento activo, botón, cabecera de tabla, etiqueta, tag y títulos de panel', expected: '600' },
  { name: 'Título', token: '--weight-title', use: 'Título de página y marca', expected: '700' },
];

export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/** One color per meaning for every `p-tag`: the same state has the same color on every screen. */
export const STATE_SEVERITY = {
  /** Ready, enabled, reserved, attended. */
  ok: 'success',
  /** Informative or new. */
  info: 'info',
  /** Pending, partial, to review. */
  pending: 'warn',
  /** Failed, no-show, conflict. */
  failed: 'danger',
  /** Neutral: cancelled, released, not applicable. */
  neutral: 'secondary',
} as const satisfies Record<string, TagSeverity>;

export type StateKind = keyof typeof STATE_SEVERITY;

/** Appointment statuses of Bienestar (DBU): label shown to people and the state it means. */
export const DBU_STATUS_VIEW: Record<string, { label: string; kind: StateKind }> = {
  reserved: { label: 'Reservada', kind: 'ok' },
  pending: { label: 'Pendiente de aprobación', kind: 'pending' },
  attended: { label: 'Atendida', kind: 'ok' },
  no_show: { label: 'No asististe', kind: 'failed' },
  cancelled: { label: 'Cancelada', kind: 'neutral' },
  released: { label: 'Cupo liberado', kind: 'neutral' },
};
