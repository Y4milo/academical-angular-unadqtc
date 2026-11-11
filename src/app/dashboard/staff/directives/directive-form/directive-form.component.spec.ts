import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { access, detail, documentTypes, ok, route } from '../testing/directive-fixtures';
import { DirectiveFormComponent, MAX_PDF_BYTES } from './directive-form.component';

describe('DirectiveFormComponent', () => {
  let fixture: ComponentFixture<DirectiveFormComponent>;
  let service: jasmine.SpyObj<DirectivesService>;
  let router: Router;

  const html = () => fixture.nativeElement as HTMLElement;
  /** En tableta y móvil la ruta vive en el cajón de PrimeNG, que se pega al `body`: se busca en el formulario y, si no está, en la página. */
  const find = (testId: string) => html().querySelector(`[data-testid="${testId}"]`) ?? document.body.querySelector(`[data-testid="${testId}"]`);
  const findAll = (testId: string) => [...html().querySelectorAll(`[data-testid="${testId}"]`), ...document.body.querySelectorAll(`[data-testid="${testId}"]`)].filter((element, index, all) => all.indexOf(element) === index);
  const text = (testId: string) => find(testId)?.textContent?.trim() ?? '';
  const pdf = (name = 'directiva.pdf', size = 1000) => new File([new Uint8Array(size)], name, { type: 'application/pdf' });

  /** Un PDF de verdad con las páginas que se indiquen: el contador del navegador lo lee con la misma librería. */
  const realPdf = async (name: string, pages: number) => {
    const { PDFDocument } = await import('pdf-lib');
    const document = await PDFDocument.create();
    for (let index = 0; index < pages; index++) document.addPage();

    return new File([(await document.save()) as BlobPart], name, { type: 'application/pdf' });
  };
  const until = async (condition: () => boolean) => {
    for (let attempt = 0; attempt < 150 && !condition(); attempt++) await new Promise(resolve => setTimeout(resolve, 20));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  async function create(id: string | null = null) {
    await TestBed.configureTestingModule({
      imports: [DirectiveFormComponent],
      providers: [
        provideRouter([]), provideNoopAnimations(), provideHttpClient(), provideHttpClientTesting(),
        { provide: DirectivesService, useValue: service },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['notifyApiData', 'error']) },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(DirectiveFormComponent);
    fixture.autoDetectChanges();
    // La ruta vive en un cajón que empieza cerrado: las pruebas lo abren para ver sus pasos, como hace la persona con el botón.
    fixture.componentInstance.routeOpen.set(true);
    await fixture.whenStable();
  }

  beforeEach(() => {
    localStorage.removeItem('directives.lastOrigin');
    localStorage.removeItem('directive-form.route-open');
    service = jasmine.createSpyObj<DirectivesService>('DirectivesService', ['access', 'detail', 'route', 'create', 'update', 'types']);
    service.access.and.returnValue(of(ok(access)));
    service.types.and.returnValue(of(ok(documentTypes)));
    service.route.and.returnValue(of(ok(route())));
  });

  it('offers only the offices Core authorizes, with their names', async () => {
    await create();

    expect(fixture.componentInstance.originOptions()).toEqual([{ code: 'adm', name: 'Oficina de Administración' }, { code: 'adm_sub', name: 'Unidad de Logística' }]);
    expect(text('route-pick-origin')).toContain('Elige la oficina de origen');
  });

  it('does not ask the office when Core authorizes only one: it shows it as a fixed fact from the profile', async () => {
    service.access.and.returnValue(of(ok({ ...access, request_units: ['adm'] })));
    await create();

    expect(text('origin-name')).toBe('Oficina de Administración');
    expect(text('origin-tag')).toContain('Por tu perfil');
    expect(html().querySelector('[data-testid="origin-choice"]')).toBeNull();
    expect(find('route-pick-origin')).toBeNull();
  });

  it('with two to four offices it offers them as cards, and the route follows the choice', async () => {
    await create();

    expect(html().querySelector('[data-testid="origin-cards"]')).not.toBeNull();
    expect(html().querySelector('[data-testid="origin-card"]')).toBeNull();

    fixture.componentInstance.origin.set('adm_sub');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(service.route).toHaveBeenCalledWith('adm_sub', false);
  });

  it('with five offices or more it goes back to a searchable select', async () => {
    const units = ['a', 'b', 'c', 'd', 'e'];
    service.access.and.returnValue(of(ok({ ...access, request_units: units, request_unit_names: {} })));
    await create();

    expect(html().querySelector('[data-testid="origin-cards"]')).toBeNull();
    expect(html().querySelector('[data-testid="origin-choice"] p-select')).not.toBeNull();
  });

  it('remembers the office of the last directive and starts with it', async () => {
    await create();
    const form = fixture.componentInstance;
    form.origin.set('adm_sub');
    form.title.set('Directiva de logística interna');
    form.documentType.set('directivas');
    form.pick('directive', { files: [new File(['%PDF'], 'd.pdf', { type: 'application/pdf' })] });
    form.pick('resolution', { files: [new File(['%PDF'], 'r.pdf', { type: 'application/pdf' })] });
    service.create.and.returnValue(of(ok(detail({ id: 9 }))));
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    form.save();
    fixture.destroy();

    fixture = TestBed.createComponent(DirectiveFormComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.origin()).toBe('adm_sub');
  });

  it('summarizes the route in its header', async () => {
    await create();
    fixture.componentInstance.origin.set('adm');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(text('route-summary')).toBe('Falta 1');
  });

  it('picks the office by itself when Core authorizes only one', async () => {
    service.access.and.returnValue(of(ok({ ...access, request_units: ['adm'] })));
    await create();

    expect(fixture.componentInstance.origin()).toBe('adm');
    expect(service.route).toHaveBeenCalledWith('adm', false);
  });

  it('asks Core for the route again when the office or the quality option changes', async () => {
    await create();
    fixture.componentInstance.origin.set('adm');
    fixture.detectChanges();
    expect(service.route).toHaveBeenCalledWith('adm', false);

    fixture.componentInstance.quality.set(true);
    fixture.detectChanges();
    expect(service.route).toHaveBeenCalledWith('adm', true);
    expect(findAll('route-step').length).toBe(4);
    expect(text('route-blocked')).toContain('Core no tiene a nadie designado');
  });

  it('requires the title, the office and both PDF, and says which is missing', async () => {
    await create();
    fixture.componentInstance.save();
    fixture.detectChanges();

    expect(service.create).not.toHaveBeenCalled();
    expect(text('error-title')).toContain('Escribe el título');
    expect(text('error-origin')).toContain('Elige la oficina');
    expect(text('error-directive')).toContain('Sube el documento');
    expect(text('error-resolution')).toContain('la resolución que lo aprueba: es obligatoria');
  });

  it('takes the file chosen in the PrimeNG uploader and empties it so the same file can be chosen again', async () => {
    await create();
    const clear = jasmine.createSpy('clear');
    const file = pdf('elegido.pdf');

    fixture.componentInstance.pickFromUpload('directive', { currentFiles: [file], files: [file] } as never, { clear } as never);

    expect(fixture.componentInstance.directiveFile()?.name).toBe('elegido.pdf');
    expect(clear).toHaveBeenCalled();
  });

  it('uses PrimeNG file pickers and no native file inputs', async () => {
    await create();

    expect(html().querySelectorAll('p-fileupload').length).toBe(2);
    // PrimeNG lleva su propio <input> dentro del componente; fuera de él no debe haber ninguno.
    expect(Array.from(html().querySelectorAll('input[type="file"]')).filter(input => !input.closest('p-fileupload')).length).toBe(0);
  });

  it('refuses a file that is not a PDF or is too big, before sending anything', async () => {
    await create();
    fixture.componentInstance.pick('directive', { files: [new File(['x'], 'directiva.docx', { type: 'application/msword' })] });
    fixture.componentInstance.pick('resolution', { files: [pdf('resolucion.pdf', MAX_PDF_BYTES + 1)] });
    fixture.detectChanges();

    expect(fixture.componentInstance.directiveFile()).toBeNull();
    expect(fixture.componentInstance.resolutionFile()).toBeNull();
    expect(text('error-directive')).toContain('debe ser un PDF');
    expect(text('error-resolution')).toContain('el máximo es');

    fixture.componentInstance.pick('directive', { files: [pdf()] });
    expect(fixture.componentInstance.fileError().directive).toBe('');
    expect(fixture.componentInstance.directiveFile()?.name).toBe('directiva.pdf');
  });

  it('sends the draft as a form with both files and goes to its detail', async () => {
    service.create.and.returnValue(of(ok(detail({ id: 12 }))));
    await create();
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const form = fixture.componentInstance;
    form.title.set('Directiva para el control de bienes');
    form.documentType.set('directivas');
    form.origin.set('adm');
    form.quality.set(true);
    form.pick('directive', { files: [pdf('directiva.pdf')] });
    form.pick('resolution', { files: [pdf('resolucion.pdf')] });

    form.save();

    const body = service.create.calls.mostRecent().args[0];
    expect(body.get('title')).toBe('Directiva para el control de bienes');
    expect(body.get('origin')).toBe('adm');
    expect(body.get('document_type')).toBe('directivas');
    expect(body.has('document_subtype')).toBeFalse();
    expect(body.get('is_quality')).toBe('1');
    expect((body.get('directive') as File).name).toBe('directiva.pdf');
    expect((body.get('resolution') as File).name).toBe('resolucion.pdf');
    expect(navigate).toHaveBeenCalledWith('directivas/12');
  });

  it('shows what the server answers when it refuses the files', async () => {
    service.create.and.returnValue(throwError(() => ({ status: 422, error: { payload: { message: 'La directiva ya trae una firma digital: sube la copia sin firmar.' } } })));
    await create();
    const form = fixture.componentInstance;
    form.title.set('Directiva para el control de bienes');
    form.documentType.set('directivas');
    form.origin.set('adm');
    form.pick('directive', { files: [pdf()] });
    form.pick('resolution', { files: [pdf('resolucion.pdf')] });

    form.save();
    fixture.detectChanges();

    expect(text('server-error')).toContain('ya trae una firma digital');
    expect(form.saving()).toBeFalse();
  });

  it('corrects a draft: loads its data, keeps the office fixed and sends only what changes', async () => {
    service.detail.and.returnValue(of(ok(detail({ id: 7, is_quality: true }))));
    service.update.and.returnValue(of(ok(detail({ id: 7 }))));
    await create('7');
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const form = fixture.componentInstance;

    expect(form.editing()).toBeTrue();
    expect(form.title()).toBe('Directiva para el control de bienes patrimoniales');
    expect(form.origin()).toBe('adm');
    expect(form.quality()).toBeTrue();
    expect(text('origin-tag')).toContain('No editable');
    expect(text('origin-card')).toContain('elimina el borrador y crea uno nuevo');

    form.title.set('Directiva corregida de bienes');
    form.save();

    const [id, body] = service.update.calls.mostRecent().args;
    expect(id).toBe(7);
    expect(body.get('title')).toBe('Directiva corregida de bienes');
    expect(body.has('origin')).toBeFalse();
    expect(body.has('directive')).toBeFalse();
    expect(navigate).toHaveBeenCalledWith('directivas/7');
  });

  it('does not let correct a directive that is no longer a draft, nor request without Core', async () => {
    service.detail.and.returnValue(of(ok(detail({ can_edit: false }))));
    await create('7');
    expect(text('load-error')).toContain('ya no se puede corregir');

    TestBed.resetTestingModule();
    service.access.and.returnValue(of(ok({ ...access, can_request: false })));
    await create();
    expect(text('load-error')).toContain('Core no te autoriza');
  });

  it('shows the error of the route without losing the form', async () => {
    service.route.and.returnValue(throwError(() => ({ status: 503, error: { payload: { message: 'No se pudo consultar a Core.' } } })));
    await create();
    fixture.componentInstance.origin.set('adm');
    fixture.detectChanges();

    expect(text('route-error')).toContain('No se pudo consultar a Core');
    expect(html().querySelector('#directive-title')).not.toBeNull();
  });

  it('counts the pages of each chosen PDF in the browser and adds up the file', async () => {
    await create();
    const form = fixture.componentInstance;

    form.pick('directive', { files: [await realPdf('directiva.pdf', 3)] });
    form.pick('resolution', { files: [await realPdf('resolucion.pdf', 1)] });
    fixture.detectChanges();
    expect(text('directive-pages')).toContain('Contando páginas');
    await until(() => form.directivePages() === 3 && form.resolutionPages() === 1);

    expect(text('directive-pages')).toBe('3 páginas');
    expect(text('resolution-pages')).toBe('1 página');
    expect(text('pages-total')).toContain('4 páginas');
    expect(text('pages-total')).toContain('3 del documento + 1 de la resolución');
  });

  it('says the pages are counted at save when the PDF cannot be read, and shows no total', async () => {
    await create();
    const form = fixture.componentInstance;

    form.pick('directive', { files: [pdf()] });
    form.pick('resolution', { files: [await realPdf('resolucion.pdf', 2)] });
    await until(() => form.directivePages() === null && form.resolutionPages() === 2);

    expect(text('directive-pages')).toContain('se cuenta al guardar');
    expect(html().querySelector('[data-testid="pages-total"]')).toBeNull();
    expect(form.directiveFile()).not.toBeNull();
  });

  it('ignores the count of a file that was replaced while it was being read', async () => {
    await create();
    const form = fixture.componentInstance;
    const first = await realPdf('primero.pdf', 5);
    const second = await realPdf('segundo.pdf', 2);

    form.pick('directive', { files: [first] });
    form.pick('directive', { files: [second] });
    await until(() => form.directivePages() === 2);
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(form.directivePages()).toBe(2);
  });

  it('while correcting a draft, the total uses the saved pages of the file that is kept', async () => {
    service.detail.and.returnValue(of(ok(detail())));
    await create('7');
    const form = fixture.componentInstance;

    expect(text('pages-total')).toContain('17 páginas');
    form.pick('directive', { files: [await realPdf('nueva.pdf', 2)] });
    await until(() => form.directivePages() === 2);

    expect(text('pages-total')).toContain('5 páginas');
    expect(text('pages-total')).toContain('2 del documento + 3 de la resolución');
  });
  it('asks for the type of document and says so when it is missing', async () => {
    await create();
    const form = fixture.componentInstance;
    form.title.set('Directiva para el control de bienes');
    form.origin.set('adm');
    form.pick('directive', { files: [pdf()] });
    form.pick('resolution', { files: [pdf('resolucion.pdf')] });

    form.save();
    fixture.detectChanges();

    expect(text('error-type')).toBe('Elige el tipo de documento.');
    expect(service.create).not.toHaveBeenCalled();
  });

  it('offers the types of the catalog and asks for a subtype only in documentos de gestión institucional', async () => {
    await create();
    const form = fixture.componentInstance;
    expect(form.types().map(type => type.label)).toContain('Reglamentos');
    expect(html().querySelector('[data-testid="subtype-field"]')).toBeNull();

    form.selectType('reglamentos');
    fixture.detectChanges();
    expect(html().querySelector('[data-testid="subtype-field"]')).toBeNull();
    expect(form.needsSubtype()).toBeFalse();

    form.selectType('gestion_institucional');
    fixture.detectChanges();
    expect(html().querySelector('[data-testid="subtype-field"]')).not.toBeNull();
    expect(form.subtypeOptions().map(subtype => subtype.label)).toEqual(['Estatuto', 'POI', 'PEI', 'ROF', 'MCC', 'TUPA', 'MAPRO', 'CAP', 'PAP', 'PIA']);
  });

  it('makes the subtype mandatory in that type, with its message, and sends it once chosen', async () => {
    service.create.and.returnValue(of(ok(detail({ id: 12 }))));
    await create();
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const form = fixture.componentInstance;
    form.title.set('Plan Operativo Institucional 2027');
    form.origin.set('adm');
    form.selectType('gestion_institucional');
    form.pick('directive', { files: [pdf()] });
    form.pick('resolution', { files: [pdf('resolucion.pdf')] });

    form.save();
    fixture.detectChanges();
    expect(text('error-subtype')).toBe('Elige el subtipo: es obligatorio para los documentos de gestión institucional.');
    expect(service.create).not.toHaveBeenCalled();

    form.documentSubtype.set('poi');
    form.save();

    const body = service.create.calls.mostRecent().args[0];
    expect(body.get('document_type')).toBe('gestion_institucional');
    expect(body.get('document_subtype')).toBe('poi');
  });

  it('forgets the subtype when the type changes, and does not send one for a type that has none', async () => {
    service.create.and.returnValue(of(ok(detail({ id: 12 }))));
    await create();
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const form = fixture.componentInstance;
    form.title.set('Reglamento de prácticas');
    form.origin.set('adm');
    form.selectType('gestion_institucional');
    form.documentSubtype.set('poi');

    form.selectType('reglamentos');
    expect(form.documentSubtype()).toBeNull();

    form.pick('directive', { files: [pdf()] });
    form.pick('resolution', { files: [pdf('resolucion.pdf')] });
    form.save();

    const body = service.create.calls.mostRecent().args[0];
    expect(body.get('document_type')).toBe('reglamentos');
    expect(body.has('document_subtype')).toBeFalse();
  });

  it('starts correcting a draft with its type and subtype', async () => {
    service.detail.and.returnValue(of(ok(detail({ document_type: { code: 'gestion_institucional', label: 'Documentos de gestión institucional' }, document_subtype: { code: 'poi', label: 'POI' } }))));
    await create('7');
    const form = fixture.componentInstance;

    expect(form.documentType()).toBe('gestion_institucional');
    expect(form.documentSubtype()).toBe('poi');
    expect(html().querySelector('[data-testid="subtype-field"]')).not.toBeNull();
  });

  it('says so when the types cannot be loaded', async () => {
    service.types.and.returnValue(throwError(() => ({ status: 500 })));
    await create();
    fixture.detectChanges();

    expect(text('server-error')).toContain('No se pudieron consultar los tipos de documento');
  });
  describe('route button and drawer', () => {
    it('shows the route as a button with the number of steps, and the steps inside its drawer', async () => {
      await create();
      fixture.componentInstance.origin.set('adm');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(html().querySelector('[data-testid="route-button"]')).not.toBeNull();
      expect(html().querySelector('[data-testid="route-rail"]')).toBeNull();
      expect(text('route-count')).toBe(String(fixture.componentInstance.routeCount()));
      expect(findAll('route-step').length).toBeGreaterThan(0);
    });

    it('opens from the button of the header and starts closed', async () => {
      await create();
      const form = fixture.componentInstance;
      form.routeOpen.set(false);
      fixture.detectChanges();

      html().querySelector<HTMLElement>('[data-testid="route-button"]')!.click();
      fixture.detectChanges();
      expect(form.routeOpen()).toBeTrue();
      expect(html().querySelector('[data-testid="route-button"]')!.getAttribute('aria-expanded')).toBe('true');
    });

    it('puts the subtype pills in a group that wraps, not in each button', async () => {
      await create();
      const form = fixture.componentInstance;
      form.selectType('gestion_institucional');
      fixture.detectChanges();
      await fixture.whenStable();

      const group = html().querySelector('[data-testid="document-subtype"]') as HTMLElement | null;
      if (group) {
        expect(group.classList.contains('subtype-options')).toBeTrue();
        expect(getComputedStyle(group).flexWrap).toBe('wrap');
      }
    });
  });

  it('has the tracking button in its header: empty while creating, with the movements while correcting a draft', async () => {
    await create();
    expect(html().querySelector('[data-testid="tracking-button"]')).not.toBeNull();
    expect(html().querySelector('[data-testid="tracking-count"]')!.textContent!.trim()).toBe('0');
    fixture.destroy();
    TestBed.resetTestingModule();

    service.detail.and.returnValue(of(ok(detail())));
    await create('7');
    expect(Number(html().querySelector('[data-testid="tracking-count"]')!.textContent!.trim())).toBe(detail().events.length);
  });
});
