import {TestBed} from '@angular/core/testing';
import {of, throwError} from 'rxjs';
import {LoginService} from '../../../../services/login.service';
import {UsersService} from '../../../../services/users.service';
import {StaffMenuStore} from './staff-menu.store';

describe('StaffMenuStore', () => {
  let getStaffMenu: jasmine.Spy;
  let userId: string;

  const response = (labels: string[]) => ({payload: {data: labels.map(label => ({label}))}});

  beforeEach(() => {
    userId = '1';
    getStaffMenu = jasmine.createSpy('getStaffMenu').and.returnValue(of(response(['Recursos humanos'])));
    TestBed.configureTestingModule({
      providers: [
        {provide: UsersService, useValue: {getStaffMenu}},
        {provide: LoginService, useValue: {getUser: () => ({id: userId})}},
      ],
    });
  });

  it('loads the menu once for the same user', () => {
    const store = TestBed.inject(StaffMenuStore);

    store.load();
    store.load();

    expect(getStaffMenu).toHaveBeenCalledTimes(1);
    expect(store.status()).toBe('ready');
    expect(store.groups().map(group => group.label)).toEqual(['Recursos humanos']);
  });

  it('loads it again when another person signs in on the same tab', () => {
    const store = TestBed.inject(StaffMenuStore);

    store.load();
    userId = '2';
    store.load();

    expect(getStaffMenu).toHaveBeenCalledTimes(2);
  });

  it('keeps an error visible and lets the user retry', () => {
    getStaffMenu.and.returnValue(throwError(() => new Error('offline')));
    const store = TestBed.inject(StaffMenuStore);

    store.load();
    expect(store.status()).toBe('error');
    expect(store.groups()).toEqual([]);

    getStaffMenu.and.returnValue(of(response(['Académico'])));
    store.load(true);
    expect(store.status()).toBe('ready');
  });

  it('forgets everything on sign out', () => {
    const store = TestBed.inject(StaffMenuStore);

    store.load();
    store.clear();

    expect(store.status()).toBe('idle');
    expect(store.groups()).toEqual([]);
  });
});
