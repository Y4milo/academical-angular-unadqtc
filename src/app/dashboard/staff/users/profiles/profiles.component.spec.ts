import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProfileDetail, ProfileItem, ProfilesService } from '../../../../services/profiles.service';
import { ProfilesComponent } from './profiles.component';

const profile = (override: Partial<ProfileItem>): ProfileItem => ({
  code: 'admin', name: 'Administrador', description: null, module: 'general', origin: 'system', permissions: ['general.consult'], permission_count: 17, people: 3,
  core_status: 'active', retired: false, can_edit: false, created_by: null, ...override,
});

const profiles: ProfileItem[] = [
  profile({}),
  profile({ code: 'custom_auditoria', name: 'Auditoría interna', module: 'attendance', origin: 'custom', permission_count: 2, people: 0, core_status: null, can_edit: true }),
  profile({ code: 'custom_apoyo', name: 'Apoyo de carné', module: 'academic', origin: 'custom', permission_count: 1, people: 5, core_status: 'pending', can_edit: true }),
  profile({ code: 'custom_historica', name: 'Consulta histórica', module: 'degrees_titles', origin: 'custom', people: 0, core_status: 'retired', retired: true }),
];

const detail: ProfileDetail = {
  profile: profiles[2], people_count: 5,
  people: [{ id: 1, nick: 'evargas', name: 'Elena Vargas', other_profiles: ['Consultas generales'] }, { id: 2, nick: 'rtorres', name: null, other_profiles: [] }],
  history: [],
};

describe('ProfilesComponent', () => {
  let service: { list: jasmine.Spy; show: jasmine.Spy; retire: jasmine.Spy };

  function create(list = of({ status: 'success', payload: { data: { profiles, permissions: {} } } } as never)) {
    service = { list: jasmine.createSpy('list').and.returnValue(list), show: jasmine.createSpy('show').and.returnValue(of({ payload: { data: detail } } as never)), retire: jasmine.createSpy('retire').and.returnValue(of({} as never)) };
    TestBed.configureTestingModule({ imports: [ProfilesComponent], providers: [provideNoopAnimations(), provideRouter([]), { provide: ProfilesService, useValue: service }] });
    const fixture = TestBed.createComponent(ProfilesComponent);
    fixture.detectChanges();

    return fixture;
  }

  it('draws every profile with its origin, people and what Core said, and a retired one as retired', () => {
    const fixture = create();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Administrador');
    expect(text).toContain('Del sistema');
    expect(text).toContain('Propio');
    expect(text).toContain('Sin publicar');
    expect(text).toContain('Pendiente');
    expect(fixture.componentInstance.coreTag(profiles[3]).label).toBe('Retirado');
  });

  it('shows the Core publication button only when the API says the person can publish', () => {
    const admin = create(of({ status: 'success', payload: { data: { profiles, permissions: {}, can_publish: true } } } as never));
    expect((admin.nativeElement as HTMLElement).textContent).toContain('Publicar a Core');
    TestBed.resetTestingModule();

    const hr = create(of({ status: 'success', payload: { data: { profiles, permissions: {}, can_publish: false } } } as never));
    expect((hr.nativeElement as HTMLElement).textContent).not.toContain('Publicar a Core');
  });

  it('filters by search, module and origin', () => {
    const fixture = create();
    const component = fixture.componentInstance;

    component.query.set('apoyo');
    expect(component.visible().map(item => item.code)).toEqual(['custom_apoyo']);

    component.query.set('');
    component.moduleFilter.set('attendance');
    expect(component.visible().map(item => item.code)).toEqual(['custom_auditoria']);

    component.moduleFilter.set('all');
    component.originFilter.set('system');
    expect(component.visible().map(item => item.code)).toEqual(['admin']);
  });

  it('offers the modules that have profiles and no empty filter', () => {
    const component = create().componentInstance;

    expect(component.moduleOptions().map(option => option.value)).toEqual(['all', 'general', 'attendance', 'academic', 'degrees_titles']);
  });

  it('only lets edit and retire the own profiles that can be edited', () => {
    const fixture = create();
    const labels = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('p-button')).map(button => button.textContent?.trim());

    expect(labels.filter(label => label === 'Retirar').length).toBe(2);
    expect(labels.filter(label => label === 'Editar').length).toBe(2);
  });

  it('shows an error with a retry instead of a blank panel', () => {
    const fixture = create(throwError(() => new Error('offline')) as never);
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se pudieron cargar los perfiles');
  });

  it('asks how many people lose the profile and keeps the retire button off until the reason has ten characters', () => {
    const fixture = create();
    const component = fixture.componentInstance;

    component.askRetire(profiles[2]);
    fixture.detectChanges();

    expect(service.show).toHaveBeenCalledWith('custom_apoyo');
    expect(component.retireDetail()?.people_count).toBe(5);
    expect(component.canRetire).toBeFalse();

    component.reason = 'corto';
    expect(component.canRetire).toBeFalse();
    component.reason = 'Se reemplaza por otro perfil.';
    expect(component.canRetire).toBeTrue();
  });

  it('retires with the reason, closes the dialog and reloads the list', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.askRetire(profiles[2]);
    component.reason = '  Se reemplaza por otro perfil.  ';

    component.confirmRetire();

    expect(service.retire).toHaveBeenCalledWith('custom_apoyo', 'Se reemplaza por otro perfil.');
    expect(component.retiring()).toBeNull();
    expect(service.list).toHaveBeenCalledTimes(2);
  });

  it('keeps the dialog open and says why when the API refuses the retirement', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    service.retire.and.returnValue(throwError(() => ({ error: { payload: { message: 'Este perfil ya está retirado.', reason: 'conflict' } } })));
    component.askRetire(profiles[2]);
    component.reason = 'Se reemplaza por otro perfil.';

    component.confirmRetire();

    expect(component.retiring()).not.toBeNull();
    expect(component.retireError()).toBe('Este perfil ya está retirado.');
  });

  it('goes to the form to create, edit or view', () => {
    const fixture = create();
    const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl');

    fixture.componentInstance.create();
    fixture.componentInstance.open(profiles[1]);
    fixture.componentInstance.open(profiles[0]);

    expect(navigate.calls.allArgs().map(args => args[0])).toEqual(['/users/profiles/new', '/users/profiles/custom_auditoria/edit', '/users/profiles/admin/view']);
  });
});
