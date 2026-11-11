/**
 * Cuántas páginas tiene un PDF, contadas en el navegador al elegirlo, para decirlo antes de guardar. El servidor vuelve a contarlas al guardar y
 * ese número es el que vale. La librería se carga solo cuando se elige un archivo.
 *
 * `undefined`: todavía no se eligió nada; `'reading'`: contando; un número: las páginas; `null`: no se pudo contar (PDF protegido o dañado).
 */
export type PageCount = 'reading' | number | null | undefined;

export async function countPdfPages(file: File): Promise<number | null> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const document = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false });
    const pages = document.getPageCount();

    return Number.isFinite(pages) && pages > 0 ? pages : null;
  } catch {
    return null;
  }
}

export const pagesLabel = (pages: number): string => (pages === 1 ? '1 página' : `${pages} páginas`);

/** La etiqueta que acompaña al archivo elegido: contando, las páginas o el aviso de que se cuenta al guardar. */
export function pagesTag(state: PageCount): { label: string; severity: 'secondary' | 'success' | 'warn' } | null {
  if (state === undefined) return null;
  if (state === 'reading') return { label: 'Contando páginas…', severity: 'secondary' };
  if (state === null) return { label: 'No se pudo contar: se cuenta al guardar', severity: 'warn' };

  return { label: pagesLabel(state), severity: 'success' };
}
