import { DirectiveDocumentType } from '../../../services/directives.service';

/** El código del tipo con el que se creó lo que existía antes de que hubiera varios tipos. */
export const DEFAULT_DOCUMENT_TYPE = 'directivas';

/** El tipo que pide subtipo: «Documentos de gestión institucional». El catálogo del servidor dice cuáles son sus subtipos. */
export const SUBTYPE_DOCUMENT_TYPE = 'gestion_institucional';

/**
 * Un color de la paleta del tema para el punto de cada tipo en los filtros y las etiquetas. Sale del código del tipo, así el mismo tipo tiene
 * siempre el mismo color en todas las pantallas sin guardar nada.
 */
const TONES = ['--p-red-500', '--p-blue-500', '--p-green-500', '--p-orange-500', '--p-purple-500', '--p-teal-500', '--p-pink-500', '--p-cyan-500', '--p-indigo-500', '--p-yellow-600'];

export function documentTypeColor(code: string | null | undefined): string {
  if (!code) return 'var(--p-surface-400)';
  let hash = 0;
  for (const letter of code) hash = (hash * 31 + letter.charCodeAt(0)) >>> 0;

  return `var(${TONES[hash % TONES.length]})`;
}

/** «Reglamentos» o «Documentos de gestión institucional · POI». */
export function documentTypeText(type: DirectiveDocumentType | null | undefined, subtype: DirectiveDocumentType | null | undefined): string {
  if (!type) return '';

  return subtype ? `${type.label} · ${subtype.label}` : type.label;
}
