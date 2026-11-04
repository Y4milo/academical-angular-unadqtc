import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {MessageService} from 'primeng/api';
import {provideRouter, Router} from '@angular/router';
import {LoginService} from '../../services/login.service';
import {StaffMenuBaseComponent} from './staff-menu-base.component';

@Component({template: 'pantalla'})
class ScreenComponent {}

describe('StaffMenuBaseComponent (marco único del personal)', () => {
  let fixture: ComponentFixture<StaffMenuBaseComponent>;
  let router: Router;
  let role = 'hr';

  const html = () => fixture.nativeElement as HTMLElement;
  const link = () => html().querySelector('[data-testid="my-attendance"]') as HTMLAnchorElement | null;

  async function create(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), MessageService,
        provideRouter([
          {path: 'inicio', component: ScreenComponent},
          {path: 'grados', component: ScreenComponent, data: {banner: 'degrees-titles'}, children: [{path: 'registros', component: ScreenComponent}]},
        ]),
        {provide: LoginService, useValue: {getUser: () => ({id: '1', role: {value: role}, staff: {names: 'Rosa Quispe'}, position: {label: 'RR.HH.'}})}},
      ],
    });
    router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    fixture = TestBed.createComponent(StaffMenuBaseComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  }

  /** Responde la petición del menú (vacío) y deja que el marco lo pinte; sin eso muestra el esqueleto de carga. */
  function answerMenu(): number {
    const requests = TestBed.inject(HttpTestingController).match(request => request.url.includes('menu'));
    requests.forEach(request => request.flush({payload: {data: []}}));
    fixture.detectChanges();

    return requests.length;
  }

  it('shows the own-attendance link only to the roles that record their own attendance, each to its own screen', async () => {
    const expected: Record<string, string | null> = {
      admin: '/admin/home', hr: '/hr/home', academic: '/academic/home', professor: '/staff/home', administrative: '/staff/home', accounting: null, degrees_titles: null, dbu: null, dbu_admin: null,
    };

    for (const [name, target] of Object.entries(expected)) {
      TestBed.resetTestingModule();
      role = name;
      await create('/inicio');
      answerMenu();

      if (target === null) {
        expect(link()).withContext(name).toBeNull();
      } else {
        expect(link()?.getAttribute('href')).withContext(name).toBe(target);
      }
    }
  });

  it('shows the test-mode notice of degrees and titles only on the screens that ask for it', async () => {
    role = 'degrees_titles';
    await create('/grados/registros');
    expect(html().querySelector('app-degrees-titles-banner')).not.toBeNull();

    await router.navigateByUrl('/inicio');
    fixture.detectChanges();
    expect(html().querySelector('app-degrees-titles-banner')).toBeNull();
  });

  it('shows no notice on a screen that does not ask for one', async () => {
    role = 'admin';
    await create('/inicio');

    expect(html().querySelector('app-degrees-titles-banner')).toBeNull();
  });

  it('asks for the menu once and keeps it while the person moves between modules', async () => {
    role = 'admin';
    await create('/inicio');
    expect(answerMenu()).toBe(1);

    await router.navigateByUrl('/grados/registros');
    fixture.detectChanges();

    expect(TestBed.inject(HttpTestingController).match(request => request.url.includes('menu')).length).toBe(0);
  });
});
