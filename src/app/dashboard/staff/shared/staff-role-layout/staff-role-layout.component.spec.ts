import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {providePrimeNG} from 'primeng/config';
import {of} from 'rxjs';
import {InstitutionalPreset} from '../../../../app.config';
import {LoginService} from '../../../../services/login.service';
import {NotificationService} from '../../../../services/notification.service';
import {UsersService} from '../../../../services/users.service';
import {StaffMenuStore} from '../staff-menu/staff-menu.store';
import {StaffRoleLayoutComponent} from './staff-role-layout.component';

@Component({template: ''})
class BlankComponent {}

describe('StaffRoleLayoutComponent', () => {
  const groups = [
    {label: 'Recursos humanos', icon: 'users', items: [{label: 'Reportes', icon: 'report', routerLink: '/hr/staff/reports'}]},
    {label: 'Académico', icon: 'school', items: [{label: 'Ranking académico', routerLink: '/hr/student/ranking'}]},
  ];
  let getStaffMenu: jasmine.Spy;
  let logoutStaff: jasmine.Spy;
  let removeUser: jasmine.Spy;

  beforeEach(async () => {
    getStaffMenu = jasmine.createSpy('getStaffMenu').and.returnValue(of({payload: {data: groups}}));
    logoutStaff = jasmine.createSpy('logoutStaff').and.returnValue(of({payload: {}}));
    removeUser = jasmine.createSpy('removeUser');

    await TestBed.configureTestingModule({
      imports: [StaffRoleLayoutComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([{path: 'hr/staff/reports', component: BlankComponent}, {path: '**', component: BlankComponent}]),
        providePrimeNG({theme: {preset: InstitutionalPreset, options: {darkModeSelector: '.app-dark'}}}),
        {provide: UsersService, useValue: {getStaffMenu, logoutStaff}},
        {provide: NotificationService, useValue: {notifyApiData: () => undefined}},
        {provide: LoginService, useValue: {getUser: () => ({id: '7', position: {label: 'Jefa de RR. HH.'}, staff: {names: 'Ana Pérez'}}), removeUser}},
      ],
    }).compileComponents();

    TestBed.inject(StaffMenuStore).clear();
  });

  async function render() {
    const fixture = TestBed.createComponent(StaffRoleLayoutComponent);
    fixture.componentRef.setInput('attendanceRouterLink', '/hr/home');
    fixture.autoDetectChanges(true);
    await fixture.whenStable();

    return fixture;
  }

  it('shows the groups of the menu with "Mis asistencias" first', async () => {
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(getStaffMenu).toHaveBeenCalledTimes(1);
    for (const label of ['Mis asistencias', 'Recursos humanos', 'Académico']) {
      expect(text).toContain(label);
    }
    expect(text.indexOf('Mis asistencias')).toBeLessThan(text.indexOf('Recursos humanos'));
  });

  it('shows the person and their initials in the account area', async () => {
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Ana Pérez');
    expect(text).toContain('Jefa de RR. HH.');
    expect(text).toContain('AP');
  });

  it('does not ask for the menu when the role has no remote menu', async () => {
    const fixture = TestBed.createComponent(StaffRoleLayoutComponent);
    fixture.componentRef.setInput('loadRemoteMenu', false);
    fixture.componentRef.setInput('attendanceRouterLink', '/staff/home');
    fixture.autoDetectChanges(true);
    await fixture.whenStable();

    expect(getStaffMenu).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Mis asistencias');
  });

  it('signs out, forgets the menu and leaves the screen', async () => {
    const fixture = await render();
    const store = TestBed.inject(StaffMenuStore);

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="logout"] button, button[data-testid="logout"]')?.click();
    await fixture.whenStable();

    expect(logoutStaff).toHaveBeenCalledTimes(1);
    expect(removeUser).toHaveBeenCalled();
    expect(store.status()).toBe('idle');
  });
});
