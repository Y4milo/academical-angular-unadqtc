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
    {url: '/admin/accounting/bank/incidents', allowed: ['admin']},
    {url: '/admin/users/accounts', allowed: ['admin']},
    {url: '/hr/home', allowed: ['hr', 'admin']},
    {url: '/hr/staff/attendance', allowed: ['hr', 'admin']},
    {url: '/academic/home', allowed: ['academic', 'admin']},
    {url: '/academic/semesters', allowed: ['academic', 'admin']},
    {url: '/accounting/bank/incidents', allowed: ['accounting', 'admin']},
    {url: '/degrees-titles/records', allowed: ['degrees_titles', 'admin']},
    {url: '/dbu/cola', allowed: ['dbu_admin', 'dbu', 'admin']},
    {url: '/dbu/config', allowed: ['dbu_admin', 'admin']},
    {url: '/staff/home', allowed: ['professor', 'administrative']},
    {url: '/users/profiles', allowed: ['admin', 'hr']},
    {url: '/users/profiles/new', allowed: ['admin', 'hr']},
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

  /** Una pantalla, una dirección: las de /admin que repetían una de Académico llevan a la del módulo, y los favoritos viejos siguen funcionando. */
  const ACADEMIC_ONE_URL: [string, string][] = [
    ['/admin/academic/semesters', '/academic/semesters'],
    ['/admin/academic/student-card', '/academic/student-card'],
    ['/admin/student/card/panel', '/academic/student/card/panel'],
    ['/admin/student/ranking', '/academic/student/ranking'],
    ['/admin/student/approved-average', '/academic/student/approved-average'],
  ];

  for (const [oldUrl, newUrl] of ACADEMIC_ONE_URL) {
    it(`sends the administrator from ${oldUrl} to ${newUrl}`, async () => {
      user = {id: '1', role: {value: 'admin'}};

      expect(await visit(oldUrl)).toBe(newUrl);
    });

    it(`lets the academic role into ${newUrl}, and an old ${oldUrl} link lands there too`, async () => {
      user = {id: '1', role: {value: 'academic'}};

      expect(await visit(newUrl)).toBe(newUrl);
      expect(await visit(oldUrl)).toBe(newUrl);
    });

    it(`sends a session without a role to the login from ${newUrl}`, async () => {
      user = {id: '1', role: {value: 'professor'}};

      expect(await visit(newUrl)).toBe('/login-admin');
    });
  }

  /** Asistencia de RR. HH.: una dirección por pantalla; la de /admin lleva a la del módulo. */
  const HR_ONE_URL: [string, string][] = [
    ['/admin/staff/attendance', '/hr/staff/attendance'],
    ['/admin/staff/attendance/register', '/hr/staff/attendance/register'],
    ['/admin/staff/attendance/manual', '/hr/staff/attendance/manual'],
    ['/admin/staff/reports', '/hr/staff/reports'],
  ];

  for (const [oldUrl, newUrl] of HR_ONE_URL) {
    for (const role of ROLES) {
      const enters = ['admin', 'hr'].includes(role);

      it(`${role} ${enters ? 'lands on' : 'is sent to the login from'} ${newUrl} through ${oldUrl}`, async () => {
        user = {id: '1', role: {value: role}};

        expect(await visit(oldUrl)).toBe(enters ? newUrl : '/login-admin');
      });
    }
  }

  /** Grados y títulos: una dirección por pantalla; la de /admin lleva a la del módulo. */
  const DEGREES_ONE_URL: [string, string][] = [
    ['/admin/degrees-titles/general-data', '/degrees-titles/general-data'],
    ['/admin/degrees-titles/calls', '/degrees-titles/calls'],
    ['/admin/degrees-titles/records', '/degrees-titles/records'],
    ['/admin/degrees-titles/exports', '/degrees-titles/exports'],
  ];

  for (const [oldUrl, newUrl] of DEGREES_ONE_URL) {
    for (const role of ROLES) {
      const enters = ['admin', 'degrees_titles'].includes(role);

      it(`${role} ${enters ? 'lands on' : 'is sent to the login from'} ${newUrl} through ${oldUrl}`, async () => {
        user = {id: '1', role: {value: role}};

        expect(await visit(oldUrl)).toBe(enters ? newUrl : '/login-admin');
      });
    }
  }

  /** Bienestar: una dirección por pantalla; la de /admin lleva a la del módulo. */
  const WELFARE_ONE_URL: [string, string, string[]][] = [
    ['/admin/dbu/cola', '/dbu/cola', ['admin', 'dbu_admin', 'dbu']],
    ['/admin/dbu/config', '/dbu/config', ['admin', 'dbu_admin']],
  ];

  for (const [oldUrl, newUrl, allowed] of WELFARE_ONE_URL) {
    for (const role of ROLES) {
      const enters = allowed.includes(role);

      it(`${role} ${enters ? 'lands on' : 'is sent to the login from'} ${newUrl} through ${oldUrl}`, async () => {
        user = {id: '1', role: {value: role}};

        expect(await visit(oldUrl)).toBe(enters ? newUrl : '/login-admin');
      });
    }
  }

  it('keeps the administrator-only student modules screen under /admin', async () => {
    user = {id: '1', role: {value: 'admin'}};

    expect(await visit('/admin/academic/student-modules')).toBe('/admin/academic/student-modules');
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
