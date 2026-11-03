import { DirectiveStatus, ProgressState } from '../../../services/directives.service';

/** El color de cada estado lo decide su significado, igual en toda la aplicación. */
export const DIRECTIVE_STATUS: Record<DirectiveStatus, { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' }> = {
  draft: { label: 'Borrador', severity: 'secondary' },
  in_signature: { label: 'En firma', severity: 'info' },
  returned: { label: 'Devuelta', severity: 'warn' },
  signed: { label: 'Firmada', severity: 'success' },
  cancelled: { label: 'Anulada', severity: 'secondary' },
};

/** El estado de cada oficina en la ruta ya enviada. */
export const DIRECTIVE_PROGRESS: Record<ProgressState, { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' }> = {
  signed: { label: 'Firmó', severity: 'success' },
  active: { label: 'Le toca', severity: 'info' },
  waiting: { label: 'Espera su turno', severity: 'secondary' },
  skipped: { label: 'Omitida', severity: 'secondary' },
};

/** Lo que dice cada hecho de la línea de tiempo. */
export const DIRECTIVE_EVENT_LABELS: Record<string, string> = {
  created: 'Creó el borrador',
  edited: 'Corrigió el borrador',
  sent: 'Envió la directiva a firma',
  signed: 'Firmó',
  rejected: 'Devolvió la directiva con observaciones',
  cancelled: 'Se anuló la directiva',
  expired: 'La directiva venció sin completar las firmas',
  step_activated: 'Le tocó firmar',
  completed: 'Todas las oficinas firmaron',
  signature_invalid: 'Una firma no pasó la validación',
  session_abandoned: 'Abrió la firma y no la terminó',
  send_failed: 'No se pudo enviar a firma',
  session_cancelled: 'Cerró la firma sin terminar',
  session_timeout: 'Se agotó el tiempo de la firma',
  session_error: 'Hubo un error al firmar',
};

export function formatBytes(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
