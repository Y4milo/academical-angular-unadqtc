import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { access, detail, ok, route } from '../testing/directive-fixtures';
import { DirectiveFormComponent, MAX_PDF_BYTES } from './directive-form.component';

describe('DirectiveFormComponent', () => {
  let fixture: ComponentFixture<DirectiveFormComponent>;
  let service: jasmine.SpyObj<DirectivesService>;
  let router: Router;

  const html = () => fixture.nativeElement as HTMLElement;
  const text = (testId: string) => html().querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? '';
  const pdf = (name = 'directiva.pdf', size = 1000) => new File([new Uint8Array(size)], name, { type: 'application/pdf' });

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
    await fixture.whenStable();
  }

  beforeEach(() => {
    service = jasmine.createSpyObj<DirectivesService>('DirectivesService', ['access', 'detail', 'route', 'create', 'update']);
    service.access.and.returnValue(of(ok(access)));
    service.route.and.returnValue(of(ok(route())));
  });

  it('offers only the offices Core authorizes, with their names', async () => {
    await create();

    expect(fixture.componentInstance.originOptions()).toEqual([{ code: 'adm', name: 'Oficina de Administración' }, { code: 'adm_sub', name: 'Unidad de Logística' }]);
    expect(text('route-pick-origin')).toContain('Elige la oficina de origen');
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
    expect(html().querySelectorAll('[data-testid="route-step"]').length).toBe(5);
    expect(text('route-blocked')).toContain('Core no tiene a nadie designado');
  });

  it('requires the title, the office and both PDF, and says which is missing', async () => {
    await create();
    fixture.componentInstance.save();
    fixture.detectChanges();

    expect(service.create).not.toHaveBeenCalled();
    expect(text('error-title')).toContain('Escribe el título');
    expect(text('error-origin')).toContain('Elige la oficina');
    expect(text('error-directive')).toContain('Sube la directiva');
    expect(text('error-resolution')).toContain('la resolución que la aprueba: es obligatoria');
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
    form.origin.set('adm');
    form.quality.set(true);
    form.pick('directive', { files: [pdf('directiva.pdf')] });
    form.pick('resolution', { files: [pdf('resolucion.pdf')] });

    form.save();

    const body = service.create.calls.mostRecent().args[0];
    expect(body.get('title')).toBe('Directiva para el control de bienes');
    expect(body.get('origin')).toBe('adm');
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
});
