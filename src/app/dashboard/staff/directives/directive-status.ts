import { DirectiveStatus, ProgressState, StepRole } from '../../../services/directives.service';

/** El color de cada estado lo decide su significado, igual en toda la aplicación. */
export const DIRECTIVE_STATUS: Record<DirectiveStatus, { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' }> = {
  draft: { label: 'Borrador', severity: 'secondary' },
  in_signature: { label: 'En firma', severity: 'info' },
  returned: { label: 'Devuelto', severity: 'warn' },
  signed: { label: 'Firmado', severity: 'success' },
  cancelled: { label: 'Anulado', severity: 'secondary' },
};

/** El estado de cada oficina en la ruta ya enviada. */
export const DIRECTIVE_PROGRESS: Record<ProgressState, { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' }> = {
  signed: { label: 'Firmó', severity: 'success' },
  active: { label: 'Le toca', severity: 'info' },
  waiting: { label: 'Espera su turno', severity: 'secondary' },
  skipped: { label: 'Omitida', severity: 'secondary' },
  rejected: { label: 'Devolvió', severity: 'danger' },
};

/** Con la directiva devuelta lo que se firmó quedó en la versión anterior y quien no llegó a firmar no tiene turno. */
/** Con la directiva anulada, quien no llegó a firmar ya no va a firmar. */
export const DIRECTIVE_PROGRESS_CANCELLED: Partial<Record<ProgressState, { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' }>> = {
  waiting: { label: 'No llegó a firmar', severity: 'secondary' },
  active: { label: 'Ya no firma', severity: 'secondary' },
};

export const DIRECTIVE_PROGRESS_RETURNED: Partial<Record<ProgressState, { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' }>> = {
  signed: { label: 'Firmó la versión anterior', severity: 'secondary' },
  waiting: { label: 'Sin turno', severity: 'secondary' },
};

/** El rol de cada oficina: el color lo decide su significado (autora, visto bueno, aprueba). */
export const STEP_ROLE: Record<StepRole, { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary'; action: string }> = {
  author: { label: 'Autor del documento', severity: 'info', action: 'Firmar como autor' },
  visto_bueno: { label: 'Visto bueno', severity: 'success', action: 'Dar visto bueno' },
  aprobacion: { label: 'Aprueba', severity: 'warn', action: 'Aprobar' },
};

/** Lo que dice cada hecho de la línea de tiempo. */
export const DIRECTIVE_EVENT_LABELS: Record<string, string> = {
  created: 'Creó el borrador',
  edited: 'Corrigió el borrador',
  sent: 'Envió el documento a firma',
  signed: 'Firmó',
  rejected: 'Devolvió el documento con observaciones',
  resubmitted: 'Corrigió y reenvió el documento a firma',
  notice_sent: 'Aviso enviado',
  notice_failed: 'No se pudo avisar',
  signed_copy_saved: 'Se guardó la copia del documento firmado',
  signed_copy_failed: 'No se pudo traer el documento firmado',
  cancelled: 'Se anuló el documento',
  expired: 'El documento venció sin completar las firmas',
  step_activated: 'Le tocó firmar',
  completed: 'Todas las oficinas firmaron',
  signature_invalid: 'Una firma no pasó la validación',
  session_abandoned: 'Abrió la firma y no la terminó',
  send_failed: 'No se pudo enviar a firma',
  session_cancelled: 'Cerró la firma sin terminar',
  session_timeout: 'Se agotó el tiempo de la firma',
  session_error: 'Hubo un error al firmar',
};

/** Qué dice cada aviso por correo, con el nombre que se le da en la línea de tiempo. */
export const DIRECTIVE_NOTICE_LABELS: Record<string, string> = {
  turn: 'te toca firmar',
  returned: 'el documento fue devuelto',
  void: 'tu firma quedó sin efecto',
  completed: 'firmaron todas las oficinas',
  cancelled: 'el documento fue anulado',
};

/** Por qué no salió un aviso. */
export const DIRECTIVE_NOTICE_FAILURES: Record<string, string> = {
  no_email: 'la persona no tiene correo institucional en Core',
  mail_error: 'el servidor de correo no respondió',
};

/** Por qué no se pudo traer el documento firmado. */
export const DIRECTIVE_SIGNED_FAILURES: Record<string, string> = {
  unreachable: 'el firmador no respondió',
  signer_error: 'el firmador devolvió un error',
  not_pdf: 'lo recibido no es un PDF',
  hash_mismatch: 'la huella no coincide con la que declara el firmador',
  no_document: 'el documento no tiene su archivo registrado en el firmador',
};

export function formatBytes(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
