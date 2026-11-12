import { Component, computed, input } from '@angular/core';
import qrcode from 'qrcode-generator';
import { SignatureSheetData, SignatureSheetRow } from '../../../../services/directives.service';

/** Una fila ya colocada en la hoja (milímetros desde el borde de arriba) con sus textos listos. */
export interface PlacedRow {
  row: SignatureSheetRow;
  top: number;
  mine: boolean;
  signed: boolean;
  lines: string[];
  statusText: string;
}

/** Cuántos caracteres caben por renglón de la franja legal (letra de 2.3 mm sobre unos 215 mm de largo). */
const STRIP_CHARS = 150;

/**
 * La hoja de firmas dibujada con lo que entrega el firmador: la plantilla institucional, el texto legal con la dirección y la clave, el QR de esa dirección y
 * una fila por firmante. Es una vista referencial para la pantalla, nunca el documento: el PDF que genera el firmador es el único válido y puede variar un
 * poco (posición del sello, tipografía). Lo que se dibuja no se copia de otro lado: todo viene del firmador, así que cambia con su entorno.
 */
@Component({
  selector: 'app-signature-sheet-view',
  template: `
    <svg class="sheet" [attr.viewBox]="'0 0 ' + sheet().page_mm.width + ' ' + sheet().page_mm.height" role="img" [attr.aria-label]="'Hoja de firmas, vista referencial, hoja ' + number() + ' de ' + sheet().sheets.length">
      <defs><clipPath [attr.id]="clipId"><rect x="0" y="0" width="595.28" height="841.89" /></clipPath></defs>
      <rect class="paper" x="0" y="0" [attr.width]="sheet().page_mm.width" [attr.height]="sheet().page_mm.height" />
      <svg x="0" y="0" [attr.width]="sheet().page_mm.width" [attr.height]="sheet().page_mm.height" viewBox="0 0 595.28 841.89" preserveAspectRatio="none">
        <g [attr.clip-path]="'url(#' + clipId + ')'">
          @for (path of artwork(); track $index) { <path [attr.d]="path.d" [attr.fill]="path.fill" /> }
        </g>
      </svg>

      <text class="title" x="77" y="23.5">{{ sheet().title }}</text>
      <text class="subtitle" x="77" y="29.4">{{ sheet().document.name }}</text>

      @for (item of placed(); track item.row.signer_id) {
        <g [attr.data-testid]="item.mine ? 'sheet-row-mine' : 'sheet-row'">
          <line class="rule" x1="38" x2="202" [attr.y1]="item.top" [attr.y2]="item.top" />
          <text class="ordinal" x="38.5" [attr.y]="item.top + 5">{{ item.row.ordinal }}</text>
          <text class="office" x="47" [attr.y]="item.top + 5">{{ item.row.office }}</text>
          <text class="role" x="47" [attr.y]="item.top + 9.4">{{ item.row.role }}</text>
          @if (item.signed) {
            <rect class="stamp" x="139.5" [attr.y]="item.top + 1" [attr.width]="sheet().layout.stamp_width_mm" [attr.height]="sheet().layout.stamp_height_mm - 1" rx="1" />
            @for (line of item.lines; track $index) {
              <text [class]="$index === 0 ? 'stamp-head' : 'stamp-line'" x="142" [attr.y]="item.top + 6.5 + $index * 3.8">{{ line }}</text>
            }
          } @else if (item.mine) {
            <rect class="mine" x="139.5" [attr.y]="item.top + 1" [attr.width]="sheet().layout.stamp_width_mm" [attr.height]="sheet().layout.stamp_height_mm - 1" rx="1.5" />
            <text class="mine-title" x="170.5" [attr.y]="item.top + 11.5">Tu firma aparecerá aquí</text>
            <text class="mine-hint" x="170.5" [attr.y]="item.top + 15.8">se coloca al firmar con tu certificado</text>
          } @else {
            <text class="pending" x="47" [attr.y]="item.top + 14.5">{{ item.statusText }}</text>
          }
        </g>
      }

      <g transform="translate(0,252) rotate(-90)" class="strip">
        @for (line of legalLines(); track $index) { <text x="0" [attr.y]="12.5 + $index * 3.2">{{ line }}</text> }
      </g>
      <g transform="translate(18,268)">
        <path class="qr" [attr.d]="qr().d" />
      </g>
      <text class="foot" x="18" y="283.5">hoja {{ number() }} de {{ sheet().sheets.length }}</text>

      <g [attr.transform]="'rotate(-24 ' + sheet().page_mm.width / 2 + ' 150)'"><text class="watermark" [attr.x]="sheet().page_mm.width / 2" y="160" text-anchor="middle">VISTA REFERENCIAL</text></g>
    </svg>
  `,
  styles: `
    :host { display: block; }
    .sheet { display: block; width: 100%; height: auto; font-family: 'Montserrat', var(--font-family, sans-serif); }
    .paper { fill: #fff; }
    .title { font-size: 5.2px; font-weight: 600; fill: #1f1f1f; }
    .subtitle { font-size: 3.2px; fill: #575756; }
    .rule { stroke: #bdbdbd; stroke-width: 0.25; }
    .ordinal { font-size: 3.6px; font-weight: 600; fill: #d21317; }
    .office { font-size: 3.1px; font-weight: 600; fill: #1f1f1f; }
    .role { font-size: 2.6px; fill: #575756; }
    .pending { font-size: 2.6px; fill: #8a8a8a; }
    .stamp { fill: none; stroke: #d21317; stroke-width: 0.3; }
    .stamp-head { font-size: 2.5px; font-weight: 600; fill: #d21317; }
    .stamp-line { font-size: 2.3px; fill: #333; }
    .mine { fill: #e6f1fb; stroke: #378add; stroke-width: 0.5; stroke-dasharray: 2 1.2; }
    .mine-title { font-size: 3.4px; font-weight: 600; fill: #0c447c; text-anchor: middle; }
    .mine-hint { font-size: 2.6px; fill: #185fa5; text-anchor: middle; }
    .strip text { font-size: 2.3px; fill: #444; }
    .qr { fill: #222; }
    .foot { font-size: 2.6px; fill: #575756; }
    .watermark { font-size: 15px; font-weight: 600; fill: #888; opacity: 0.13; }
  `,
})
export class SignatureSheetViewComponent {
  static nextId = 0;

  readonly sheet = input.required<SignatureSheetData>();
  /** Id del firmante al que le toca a quien mira; su fila lleva el recuadro «Tu firma aparecerá aquí». */
  readonly mine = input<string | null>(null);

  readonly clipId = `sheet-clip-${SignatureSheetViewComponent.nextId++}`;

  /** La hoja que se muestra: la que tiene la fila de quien mira, o la primera. */
  readonly number = computed(() => {
    const mine = this.mine();
    const found = mine ? this.sheet().sheets.find(item => item.rows.some(row => row.signer_id === mine)) : undefined;

    return found?.number ?? this.sheet().sheets[0]?.number ?? 1;
  });

  readonly placed = computed<PlacedRow[]>(() => {
    const data = this.sheet();
    const rows = data.sheets.find(item => item.number === this.number())?.rows ?? [];

    return rows.map((row, index) => {
      const signed = row.status === 'signed';

      return {
        row,
        top: data.layout.first_row_top_mm + index * data.layout.row_pitch_mm,
        mine: !signed && row.signer_id === this.mine(),
        signed,
        lines: signed ? this.stampLines(row) : [],
        statusText: STATUS_TEXT[row.status] ?? 'Pendiente de firma',
      };
    });
  });

  /** Las dos formas de la plantilla (los trazos del arte institucional), leídas del SVG sin insertar su marcado en la página. */
  readonly artwork = computed(() => {
    try {
      const doc = new DOMParser().parseFromString(this.sheet().template_svg, 'image/svg+xml');

      return Array.from(doc.querySelectorAll('path')).map(path => ({ d: path.getAttribute('d') ?? '', fill: path.closest('[fill]')?.getAttribute('fill') ?? '#d21317' })).filter(path => path.d !== '');
    } catch {
      return [];
    }
  });

  readonly legalLines = computed(() => wrap(this.sheet().legal_text, STRIP_CHARS));

  /** El QR de la dirección de verificación que da el firmador, como un solo trazo de cuadritos de 11 mm de lado. */
  readonly qr = computed(() => {
    const code = qrcode(0, 'M');
    code.addData(this.sheet().verification.url);
    code.make();
    const count = code.getModuleCount();
    const cell = 11 / count;
    let d = '';
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        if (code.isDark(y, x)) d += `M${(x * cell).toFixed(3)},${(y * cell).toFixed(3)}h${cell.toFixed(3)}v${cell.toFixed(3)}h-${cell.toFixed(3)}z`;
      }
    }

    return { d };
  });

  private stampLines(row: SignatureSheetRow): string[] {
    const when = row.signed_at ? new Date(row.signed_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '';

    return ['Firmado digitalmente por', (row.holder_name ?? '').toUpperCase(), row.reason ? `Motivo: ${row.reason}` : '', when ? `Fecha: ${when}` : ''].filter(line => line !== '');
  }
}

const STATUS_TEXT: Record<string, string> = {
  pending: 'Pendiente de firma',
  rejected: 'Rechazó la firma',
  skipped: 'No participa',
};

/** Parte un texto en renglones de a lo más `max` caracteres, sin cortar palabras. */
export function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line !== '' && (line + ' ' + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line === '' ? word : `${line} ${word}`;
    }
  }
  if (line !== '') lines.push(line);

  return lines;
}
