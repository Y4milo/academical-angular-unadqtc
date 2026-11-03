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
  signed: 'Firmó',
  rejected: 'Devolvió la directiva con observaciones',
  cancelled: 'Se anuló la directiva',
  expired: 'La directiva venció sin completar las firmas',
  step_activated: 'Le tocó firmar',
  completed: 'Todas las oficinas firmaron',
  signature_invalid: 'Una firma no pasó la validación',
  session_abandoned: 'Abrió la firma y no la terminó',
  send_failed: 'No se pudo enviar a firma',
};

export function formatBytes(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
