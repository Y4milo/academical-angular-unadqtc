import { DirectiveStatus } from '../../../services/directives.service';

/** El color de cada estado lo decide su significado, igual en toda la aplicación. */
export const DIRECTIVE_STATUS: Record<DirectiveStatus, { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' }> = {
  draft: { label: 'Borrador', severity: 'secondary' },
  in_signature: { label: 'En firma', severity: 'info' },
  returned: { label: 'Devuelta', severity: 'warn' },
  signed: { label: 'Firmada', severity: 'success' },
  cancelled: { label: 'Anulada', severity: 'secondary' },
};

/** Lo que dice cada hecho de la línea de tiempo. */
export const DIRECTIVE_EVENT_LABELS: Record<string, string> = {
  created: 'Creó el borrador',
  edited: 'Corrigió el borrador',
  sent: 'Envió la directiva a firma',
  signed: 'Firmó la directiva',
  rejected: 'Devolvió la directiva',
  cancelled: 'Anuló la directiva',
};

export function formatBytes(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
