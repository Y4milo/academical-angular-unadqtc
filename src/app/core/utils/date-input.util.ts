/**
 * Conversión entre las fechas que usa la API (texto) y el modelo de `p-datepicker` (Date). Se trabaja siempre con la hora local del
 * navegador: "2026-11-02" y "2026-11-02 08:30" son fecha y fecha con hora, sin zona horaria.
 */
const pad = (value: number): string => String(value).padStart(2, '0');

/** "2026-11-02" -> Date a medianoche local; vacío o inválido -> null. */
export function isoToDate(value: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

/** Date -> "2026-11-02"; null -> "". */
export function dateToIso(value: Date | null | undefined): string {
  return value ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` : '';
}

/** "2026-11-02 08:30" (o con "T") -> Date local; vacío o inválido -> null. */
export function dateTimeToDate(value: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(value ?? '');
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5])) : null;
}

/** Date -> "2026-11-02 08:30"; null -> null. */
export function dateToDateTime(value: Date | null | undefined): string | null {
  return value ? `${dateToIso(value)} ${pad(value.getHours())}:${pad(value.getMinutes())}` : null;
}
