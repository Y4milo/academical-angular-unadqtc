import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProfileItem, ProfilesIndex, ProfilesService } from '../../../../services/profiles.service';
import { ProfileFormComponent } from './profile-form.component';

const permissions: ProfilesIndex['permissions'] = {
  general: [{ code: 'general.consult', label: 'Consultas generales y perfil propio' }],
  attendance: [{ code: 'attendance.view', label: 'Asistencia: consulta' }, { code: 'attendance.manage', label: 'Asistencia: gestión', includes: ['attendance.list', 'attendance.manual'] }, { code: 'attendance.list', label: 'Asistencia: lista del personal' }, { code: 'attendance.manual', label: 'Asistencia: registros manuales' }],
  accounting: [
    { code: 'accounting.bank', label: 'Contabilidad: pagos y archivos del Banco de la Nación', includes: ['accounting.incidents', 'accounting.files', 'accounting.traces'] },
    { code: 'accounting.settings', label: 'Contabilidad: configuración del banco' }, { code: 'accounting.incidents', label: 'Contabilidad: incidencias del banco' },
    { code: 'accounting.files', label: 'Contabilidad: archivos del banco' }, { code: 'accounting.traces', label: 'Contabilidad: trazabilidad de IP' },
  ],
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

    expect(component.groups().map(group => group.label)).toEqual(['General', 'Asistencia', 'Contabilidad']);
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

  describe('permissions per screen', () => {
    it('splits a module into its screens, the permission of the whole module and the rest', () => {
      const groups = create(null).componentInstance.groups();
      const accounting = groups.find(group => group.module === 'accounting')!;

      expect(accounting.umbrella?.code).toBe('accounting.bank');
      expect(accounting.rows.map(row => row.code)).toEqual(['accounting.incidents', 'accounting.files', 'accounting.traces', 'accounting.settings']);
      expect(groups.find(group => group.module === 'general')!.umbrella).toBeNull();
    });

    it('drops the module prefix of the label and capitalizes it', () => {
      const component = create(null).componentInstance;

      expect(component.rowLabel({ code: 'accounting.incidents', label: 'Contabilidad: incidencias del banco' })).toBe('Incidencias del banco');
      expect(component.rowLabel({ code: 'general.consult', label: 'Consultas generales y perfil propio' })).toBe('Consultas generales y perfil propio');
    });

    it('marks one screen only and counts it in its module', () => {
      const component = create(null).componentInstance;
      const accounting = component.groups().find(group => group.module === 'accounting')!;

      component.toggle('accounting.incidents', true);

      expect(component.selected()).toEqual(['accounting.incidents']);
      expect(component.isSelected('accounting.files')).toBeFalse();
      expect(component.moduleCount(accounting)).toBe(1);
      expect(component.moduleState(accounting)).toBe('some');
    });

    it('marks the whole module with its own permission, keeps the sensitive screen out and shows every screen as marked', () => {
      const component = create(null).componentInstance;
      const accounting = component.groups().find(group => group.module === 'accounting')!;

      component.toggleModule(accounting, true);

      expect(component.selected()).toEqual(['accounting.bank']);
      expect(['accounting.incidents', 'accounting.files', 'accounting.traces'].every(code => component.isSelected(code))).toBeTrue();
      expect(component.isSelected('accounting.settings')).toBeFalse();
      expect(component.moduleState(accounting)).toBe('all');
    });

    it('replaces the module permission by the screens that stay when one is unmarked', () => {
      const component = create(null).componentInstance;
      const accounting = component.groups().find(group => group.module === 'accounting')!;
      component.toggleModule(accounting, true);

      component.toggle('accounting.files', false);

      expect([...component.selected()].sort()).toEqual(['accounting.incidents', 'accounting.traces']);
      expect(component.moduleState(accounting)).toBe('some');
    });

    it('swaps loose screens for the module permission when the whole module is marked after them', () => {
      const component = create(null).componentInstance;
      const accounting = component.groups().find(group => group.module === 'accounting')!;
      component.toggle('accounting.incidents', true);

      component.toggleModule(accounting, true);

      expect(component.selected()).toEqual(['accounting.bank']);
    });

    it('clears the module when its toggle is unmarked', () => {
      const component = create(null).componentInstance;
      const accounting = component.groups().find(group => group.module === 'accounting')!;
      component.toggleModule(accounting, true);
      component.toggle('accounting.settings', true);

      component.toggleModule(accounting, false);

      expect(component.selected()).toEqual([]);
      expect(component.moduleState(accounting)).toBe('none');
    });

    it('opens only the modules that have something marked and lets the person open the rest', () => {
      const component = create('custom_auditoria').componentInstance;

      expect(component.isOpen('attendance')).toBeTrue();
      expect(component.isOpen('accounting')).toBeFalse();
      component.setOpen('accounting', true);
      expect(component.isOpen('accounting')).toBeTrue();
    });

    it('shows the screens of a saved module permission as marked when editing', () => {
      const saved = { ...own, permissions: ['attendance.manage'] };
      const component = create('custom_auditoria', [saved, system]).componentInstance;

      expect(component.isSelected('attendance.list')).toBeTrue();
      expect(component.isSelected('attendance.manual')).toBeTrue();
      expect(component.moduleState(component.groups().find(group => group.module === 'attendance')!)).toBe('all');
    });

    it('tags the sensitive and the hide-only screens', () => {
      const component = create(null).componentInstance;

      expect(component.sensitive('accounting.settings')).toBeTrue();
      expect(component.sensitive('accounting.files')).toBeFalse();
      expect(component.hideOnly('student_card.ranking')).toBeTrue();
      expect(component.hideOnly('student_card.panel')).toBeFalse();
    });

    it('shows the code as an automatic line, not as a field', () => {
      const fixture = create(null);
      fixture.componentInstance.name = 'Contabilidad: solo incidencias';
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;

      expect(host.querySelector('input[aria-label="Código"]')).toBeNull();
      expect(host.querySelector('[data-testid="auto-code"]')?.textContent).toContain('custom_contabilidad_solo_incidencias');
      expect(host.querySelector('[data-testid="auto-code"]')?.textContent).toContain('Automático');
    });
  });
});
