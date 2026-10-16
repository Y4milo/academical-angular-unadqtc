/** Mensaje legible de un error del API de la cola (el del servidor si lo trae). */
export function dbuQueueErrorMessage(error: unknown, fallback = 'No se pudo completar la acción. Inténtalo nuevamente.'): string {
  const body = (error as { error?: { payload?: { message?: string } } })?.error;
  return body?.payload?.message ?? fallback;
}

/** "miércoles 22 de octubre" a partir de AAAA-MM-DD, sin que la zona horaria mueva el día. */
export function dbuDayLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(year, month - 1, day));
}
