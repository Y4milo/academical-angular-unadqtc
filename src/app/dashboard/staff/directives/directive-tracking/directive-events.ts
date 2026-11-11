import { DirectiveEvent } from '../../../../services/directives.service';
import { DIRECTIVE_EVENT_LABELS, DIRECTIVE_NOTICE_FAILURES, DIRECTIVE_NOTICE_LABELS, DIRECTIVE_SIGNED_FAILURES } from '../directive-status';

/** Qué cuenta cada hecho del seguimiento de una directiva. Lo usa el cajón «Seguimiento» de todas las pantallas de directivas. */

export interface EventChange {
  label: string;
  before: string;
  after: string;
}

export function eventLabel(event: DirectiveEvent): string {
  const data = event.data as { notice?: string; reason?: string; directive_replaced?: boolean; resolution_replaced?: boolean; changes?: Record<string, unknown> };
  if (event.type === 'edited') {
    const files = data.directive_replaced || data.resolution_replaced;
    const fields = Object.keys(data.changes ?? {}).length > 0;
    if (files && fields) return 'Corrigió el borrador';
    if (files) return data.directive_replaced && data.resolution_replaced ? 'Reemplazó el documento y la resolución' : `Reemplazó ${data.directive_replaced ? 'el documento' : 'la resolución'}`;
    if (fields) return 'Corrigió los datos';
  }
  if (event.type === 'notice_sent') return `Aviso enviado: ${DIRECTIVE_NOTICE_LABELS[data.notice ?? ''] ?? 'aviso'}`;
  if (event.type === 'signed_copy_failed') return `No se pudo traer el documento firmado: ${DIRECTIVE_SIGNED_FAILURES[data.reason ?? ''] ?? 'error desconocido'}`;
  if (event.type === 'notice_failed') return `No se pudo avisar: ${DIRECTIVE_NOTICE_FAILURES[data.reason ?? ''] ?? 'no salió el correo'}`;

  return DIRECTIVE_EVENT_LABELS[event.type] ?? event.type;
}

/** Los avisos los envía Academical; los demás hechos los cuenta el firmador o una persona. */
export function eventAuthor(event: DirectiveEvent): string {
  if (event.by) return [event.by.name ?? 'Usuario de Academical', event.by.office].filter(Boolean).join(' · ');

  return event.type.startsWith('notice_') || event.type.startsWith('signed_copy_') ? 'Academical' : 'Firmador';
}

/** Lo que el hecho cuenta además: la oficina, la persona y, si la devolvió, su motivo. */
export function eventDetail(event: DirectiveEvent): string {
  const data = event.data as { office?: string; person?: string; reason?: string; notice?: string; signatures?: number };
  if (event.type === 'signed_copy_saved') return data.signatures ? `${data.signatures} firmas` : '';
  if (event.type === 'signed_copy_failed') return 'se vuelve a intentar al pulsar «Descargar firmada»';
  if (event.type.startsWith('notice_')) {
    const to = [data.person ? `Para ${data.person}` : null, data.office].filter(Boolean).join(' · ');
    const pending = event.type === 'notice_failed' && data.notice === 'turn' ? 'la firma pendiente le aparece igual en «Por firmar»' : '';

    return [to, pending].filter(Boolean).join(' · ');
  }

  return [data.office, data.person, data.reason].filter(Boolean).join(' · ');
}

/** Lo que cambió en un borrador, para mostrarlo como «antes → ahora»: los datos que se corrigieron y los PDF que se reemplazaron. */
export function eventChanges(event: DirectiveEvent): EventChange[] {
  if (event.type !== 'edited') return [];
  const data = event.data as {
    changes?: Record<string, { before: unknown; after: unknown }>;
    directive_before?: string | null; directive_after?: string | null; resolution_before?: string | null; resolution_after?: string | null;
  };
  const labels: Record<string, string> = { title: 'Título', is_quality: 'Proceso de calidad', document_type: 'Tipo de documento', document_subtype: 'Subtipo' };
  const show = (value: unknown): string => (value === null || value === undefined || value === '' ? '—' : typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value));
  const rows = Object.entries(data.changes ?? {}).map(([field, change]) => ({ label: labels[field] ?? field, before: show(change.before), after: show(change.after) }));
  if (data.directive_before && data.directive_after) rows.push({ label: 'Documento', before: data.directive_before, after: data.directive_after });
  if (data.resolution_before && data.resolution_after) rows.push({ label: 'Resolución', before: data.resolution_before, after: data.resolution_after });

  return rows;
}
