import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignatureSheetData } from '../../../../services/directives.service';
import { SignatureSheetViewComponent, wrap } from './signature-sheet-view.component';

describe('SignatureSheetViewComponent', () => {
  let fixture: ComponentFixture<SignatureSheetViewComponent>;

  const rows = (count: number, from = 1) =>
    Array.from({ length: count }, (_, i) => ({ ordinal: from + i, signer_id: `sg_${from + i}`, office: `Oficina ${from + i}`, role: 'Aprueba', status: 'pending', holder_name: null, title: null, reason: null, signed_at: null }));
  const data = (sheets: { number: number; rows: ReturnType<typeof rows> }[]): SignatureSheetData => ({
    referential: true, test: false, page_mm: { width: 210, height: 297 }, document: { id: 'd', name: 'Documento de ejemplo' },
    verification: { site: 'https://firmador.test', url: 'https://firmador.test/ABC123', code: 'ABC123' },
    legal_text: 'Texto legal. Clave: ABC123', institution: 'Institución de ejemplo', title: 'Hoja de firmas',
    template_svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595.28 841.89"><g fill="#d21317"><path d="M0,0h10v10z"/><path d="M20,20h5v5z"/></g></svg>',
    layout: { first_row_top_mm: 54, row_pitch_mm: 23, rows_per_sheet: 4, stamp_width_mm: 62, stamp_height_mm: 22 },
    sheets,
  });
  const render = (sheet: SignatureSheetData, mine: string | null) => {
    fixture = TestBed.createComponent(SignatureSheetViewComponent);
    fixture.componentRef.setInput('sheet', sheet);
    fixture.componentRef.setInput('mine', mine);
    fixture.detectChanges();
  };
  const html = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => TestBed.configureTestingModule({ imports: [SignatureSheetViewComponent] }));

  it('draws the template paths, a QR and a referential watermark', () => {
    render(data([{ number: 1, rows: rows(2) }]), null);

    expect(html().querySelectorAll('g[clip-path] path').length).toBe(2);
    expect(html().querySelector('path.qr')?.getAttribute('d')?.length).toBeGreaterThan(100);
    expect(html().querySelector('.watermark')?.textContent).toContain('VISTA REFERENCIAL');
    expect(html().querySelector('svg')?.getAttribute('aria-label')).toContain('vista referencial');
  });

  it('places each row at the first row plus the pitch, both given by the Firmador', () => {
    render(data([{ number: 1, rows: rows(3) }]), null);

    const ys = Array.from(html().querySelectorAll('line.rule')).map(line => Number(line.getAttribute('y1')));
    expect(ys).toEqual([54, 77, 100]);
  });

  it('shows the sheet that has the row of the person and marks it', () => {
    render(data([{ number: 1, rows: rows(4) }, { number: 2, rows: rows(1, 5) }]), 'sg_5');

    expect(html().querySelector('[data-testid="sheet-row-mine"]')?.textContent).toContain('Oficina 5');
    expect(html().querySelector('.foot')?.textContent).toContain('hoja 2 de 2');
  });

  it('wraps the legal text without cutting words', () => {
    expect(wrap('uno dos tres cuatro', 8)).toEqual(['uno dos', 'tres', 'cuatro']);
  });
});
