import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProfileItem, ProfilesIndex, ProfilesService } from '../../../../services/profiles.service';
import { ProfileFormComponent } from './profile-form.component';

const permissions: ProfilesIndex['permissions'] = {
  general: [{ code: 'general.consult', label: 'Consultas generales y perfil propio' }],
  attendance: [{ code: 'attendance.view', label: 'Asistencia: consulta' }, { code: 'attendance.manage', label: 'Asistencia: gestión' }],
};

const own: ProfileItem = {
  code: 'custom_auditoria', name: 'Auditoría interna', description: 'Consulta', module: 'attendance', origin: 'custom', permissions: ['attendance.view'], permission_count: 1,
  people: 2, core_status: null, retired: false, can_edit: true, created_by: 1,
};
const system: ProfileItem = { ...own, code: 'admin', name: 'Administrador', origin: 'system', can_edit: false };

describe('ProfileFormComponent', () => {
  let service: { list: jasmine.Spy; create: jasmine.Spy; update: jasmine.Spy; previewMenu: jasmine.Spy };
  let navigate: jasmine.Spy;

  function create(code: string | null, profiles: ProfileItem[] = [own, system]) {
    service = {
      list: jasmine.createSpy('list').and.returnValue(of({ payload: { data: { profiles, permissions } } } as never)),
      create: jasmine.createSpy('create').and.returnValue(of({} as never)),
      update: jasmine.createSpy('update').and.returnValue(of({} as never)),
      previewMenu: jasmine.createSpy('previewMenu').and.returnValue(of({ payload: { data: [] } } as never)),
    };
    TestBed.configureTestingModule({
      imports: [ProfileFormComponent],
      providers: [provideNoopAnimations(), provideRouter([]), { provide: ProfilesService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(code ? { code } : {}) } } }],
    });
    navigate = spyOn(TestBed.inject(Router), 'navigateByUrl');
    const fixture = TestBed.createComponent(ProfileFormComponent);
    fixture.detectChanges();

    return fixture;
  }

  it('offers the permissions grouped by module and builds the code from the name', () => {
    const fixture = create(null);
    const component = fixture.componentInstance;

    expect(component.groups().map(group => group.label)).toEqual(['General', 'Asistencia']);
    component.name = 'Auditoría interna';
    expect(component.previewCode).toBe('custom_auditoria_interna');
  });

  it('needs a name of three characters and at least one permission to save', () => {
    const component = create(null).componentInstance;

    expect(component.canSave).toBeFalse();
    component.name = 'Aud';
    expect(component.canSave).toBeFalse();
    component.toggle('attendance.view', true);
    expect(component.canSave).toBeTrue();
    component.toggle('attendance.view', false);
    expect(component.canSave).toBeFalse();
  });

  it('creates the profile and goes back to the list', () => {
    const component = create(null).componentInstance;
    component.name = 'Auditoría interna';
    component.description = ' Consulta ';
    component.toggle('attendance.view', true);

    component.save();

    expect(service.create).toHaveBeenCalledWith({ name: 'Auditoría interna', description: 'Consulta', module: 'other', permissions: ['attendance.view'], confirmed: false });
    expect(navigate).toHaveBeenCalledWith('/users/profiles');
  });

  it('loads an own profile to edit and keeps its code', () => {
    const component = create('custom_auditoria').componentInstance;

    expect(component.name).toBe('Auditoría interna');
    expect(component.selected()).toEqual(['attendance.view']);
    expect(component.previewCode).toBe('custom_auditoria');
    expect(component.readOnly()).toBeFalse();
  });

  it('shows a system profile as read only and does not save', () => {
    const component = create('admin').componentInstance;

    expect(component.readOnly()).toBeTrue();
    expect(component.canSave).toBeFalse();
    component.save();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('asks to confirm when the permissions of a profile with people change, then resends confirmed', () => {
    const component = create('custom_auditoria').componentInstance;
    service.update.and.returnValues(throwError(() => ({ error: { payload: { message: 'Afecta a 2.', reason: 'needs_confirmation', people: 2 } } })), of({} as never));
    component.toggle('attendance.manage', true);

    component.save();
    expect(component.confirmPeople()).toBe(2);
    expect(navigate).not.toHaveBeenCalled();

    component.confirmChange();
    expect(service.update.calls.mostRecent().args[1].confirmed).toBeTrue();
    expect(navigate).toHaveBeenCalledWith('/users/profiles');
  });

  it('shows the menu that the marked permissions would open, grouped, and refreshes it when they change', fakeAsync(() => {
    const fixture = create(null);
    service.previewMenu.and.returnValue(of({ payload: { data: [{ label: 'Recursos humanos', icon: 'users', items: [{ label: 'Asistencias del personal', routerLink: '/hr/staff/attendance' }] }] } } as never));
    const component = fixture.componentInstance;

    component.toggle('attendance.manage', true);
    tick(300);
    fixture.detectChanges();

    expect(service.previewMenu).toHaveBeenCalledWith(['attendance.manage']);
    expect(component.previewMenu()).toEqual([{ label: 'Recursos humanos', expanded: true, items: [{ label: 'Asistencias del personal' }] }]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Recursos humanos');
  }));

  it('waits for a moment so that marking several permissions in a row asks only once', fakeAsync(() => {
    const component = create(null).componentInstance;
    service.previewMenu.calls.reset();

    component.toggle('attendance.view', true);
    component.toggle('attendance.manage', true);
    tick(300);

    expect(service.previewMenu).toHaveBeenCalledTimes(1);
    expect(service.previewMenu).toHaveBeenCalledWith(['attendance.view', 'attendance.manage']);
  }));

  it('says that the permissions open no screen when the menu is empty', fakeAsync(() => {
    const fixture = create(null);
    fixture.componentInstance.toggle('attendance.view', true);
    tick(300);
    fixture.detectChanges();

    expect(fixture.componentInstance.previewMenu()).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="preview-empty"]')?.textContent).toContain('no abren ninguna pantalla');
  }));

  it('does not block saving when the preview cannot be calculated', fakeAsync(() => {
    const fixture = create(null);
    service.previewMenu.and.returnValue(throwError(() => new Error('offline')));
    const component = fixture.componentInstance;
    component.name = 'Auditoría interna';

    component.toggle('attendance.view', true);
    tick(300);
    fixture.detectChanges();

    expect(component.previewFailed()).toBeTrue();
    expect(component.canSave).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se pudo calcular el menú');
  }));

  it('says plainly when the profile does not exist', () => {
    const fixture = create('custom_no_existe');

    expect(fixture.componentInstance.error()).toBe('No encontramos ese perfil.');
  });

  it('shows the API error when saving fails for another reason', () => {
    const component = create(null).componentInstance;
    service.create.and.returnValue(throwError(() => ({ error: { payload: { message: 'No puede dar el permiso users.manage.', reason: 'forbidden' } } })));
    component.name = 'Auditoría interna';
    component.toggle('attendance.view', true);

    component.save();

    expect(component.error()).toBe('No puede dar el permiso users.manage.');
    expect(component.saving()).toBeFalse();
  });
});
