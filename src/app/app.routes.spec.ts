import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {routes} from './app.routes';
import {LoginService} from './services/login.service';

/**
 * La tabla de rutas del personal: qué dirección lleva a qué grupo, quién entra a cada uno y qué pasa con lo que no existe. Se escribió con el
 * comportamiento ANTERIOR al marco único y debe seguir igual después: cambia cómo se agrupan las rutas, no a dónde llevan ni quién entra.
 */
describe('staff routes', () => {
  let router: Router;
  let user: {id: string; role: {value: string}; permissions?: string[]} | null = null;

  const ROLES = ['admin', 'hr', 'academic', 'accounting', 'degrees_titles', 'dbu_admin', 'dbu', 'administrative', 'professor'];

  /** Una dirección de cada grupo de rutas con los roles que entran a ella (los de su guarda). */
  const GROUPS: {url: string; allowed: string[]}[] = [
    {url: '/admin/home', allowed: ['admin']},
    {url: '/admin/dbu/config', allowed: ['admin']},
    {url: '/admin/accounting/bank/incidents', allowed: ['admin']},
    {url: '/admin/degrees-titles/records', allowed: ['admin']},
    {url: '/admin/users/accounts', allowed: ['admin']},
    {url: '/hr/home', allowed: ['hr']},
    {url: '/hr/staff/attendance', allowed: ['hr']},
    {url: '/academic/home', allowed: ['academic']},
    {url: '/academic/semesters', allowed: ['academic']},
    {url: '/accounting/bank/incidents', allowed: ['accounting', 'admin']},
    {url: '/degrees-titles/records', allowed: ['degrees_titles']},
    {url: '/dbu/cola', allowed: ['dbu_admin', 'dbu', 'admin']},
    {url: '/dbu/config', allowed: ['dbu_admin', 'admin']},
    {url: '/staff/home', allowed: ['professor', 'administrative']},
    {url: '/directivas', allowed: ROLES},
    {url: '/directivas/configuracion', allowed: ['admin']},
  ];

  beforeEach(() => {
    user = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {provide: LoginService, useValue: {getUser: () => user, getStudent: () => null, isStudentLoggedIn: () => false}},
      ],
    });
    router = TestBed.inject(Router);
  });

  async function visit(url: string): Promise<string> {
    await router.navigateByUrl(url);

    return router.url.split('?')[0];
  }

  for (const group of GROUPS) {
    for (const role of ROLES) {
      const allowed = group.allowed.includes(role);

      it(`${role} ${allowed ? 'enters' : 'is sent to the login from'} ${group.url}`, async () => {
        user = {id: '1', role: {value: role}};

        expect(await visit(group.url)).toBe(allowed ? group.url : '/login-admin');
      });
    }
  }

  it('sends somebody without a session to the login from every staff group', async () => {
    for (const group of GROUPS) {
      expect(await visit(group.url)).toBe('/login-admin');
    }
  });

  it('keeps the redirects of the home of each group', async () => {
    user = {id: '1', role: {value: 'degrees_titles'}};
    expect(await visit('/degrees-titles')).toBe('/degrees-titles/calls');
    user = {id: '1', role: {value: 'accounting'}};
    expect(await visit('/accounting')).toBe('/accounting/bank/incidents');
    user = {id: '1', role: {value: 'admin'}};
    expect(await visit('/admin')).toBe('/admin/home');
  });

  it('keeps the public pages of Bienestar open and the old links working', async () => {
    expect(await visit('/dbu/citas')).toBe('/dbu/citas');
    expect(await visit('/dbu/citas/estado')).toBe('/dbu/citas/estado');
    expect(await visit('/citas')).toBe('/dbu/citas');
    expect(await visit('/citas/estado')).toBe('/dbu/citas/estado');
  });

  it('sends what does not exist to the login', async () => {
    user = {id: '1', role: {value: 'admin'}};

    expect(await visit('/no-existe/nada')).toBe('/login-admin');
  });

  it('lets a session that carries permissions in by what the person can do, not by role', async () => {
    user = {id: '1', role: {value: 'professor'}, permissions: ['attendance.manage']};

    expect(await visit('/hr/home')).toBe('/hr/home');
  });

  it('keeps out a session whose permissions do not include the one the group asks for, whatever its role', async () => {
    user = {id: '1', role: {value: 'hr'}, permissions: ['attendance.view']};

    expect(await visit('/hr/home')).toBe('/login-admin');
  });

  it('lets a person with two profiles into the modules of both', async () => {
    user = {id: '1', role: {value: 'accounting'}, permissions: ['accounting.bank', 'student_card.manage']};

    expect(await visit('/accounting/bank/incidents')).toBe('/accounting/bank/incidents');
    expect(await visit('/academic/student/card/panel')).toBe('/academic/student/card/panel');
  });
});
