import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CorePublicationStatus, ProfilesService } from '../../../../services/profiles.service';
import { ProfilesCoreComponent } from './profiles-core.component';

const sent = { id: 2, status: 'sent' as const, profile_count: 12, summary: null, error: null, actor: 'atorres', created_at: '2026-11-04 10:00:00' };
const failed = { id: 1, status: 'failed' as const, profile_count: 11, summary: null, error: 'Core no respondió.', actor: 'atorres', created_at: '2026-11-03 10:00:00' };

const status = (override: Partial<CorePublicationStatus> = {}): CorePublicationStatus => ({
  last: sent, history: [sent, failed],
  profiles: [{ code: 'custom_a', name: 'Auditoría interna', core_status: 'pending', retired: false }, { code: 'custom_b', name: 'Consulta histórica', core_status: 'retired', retired: true }, { code: 'custom_c', name: 'Nuevo', core_status: null, retired: false }],
  ...override,
});

describe('ProfilesCoreComponent', () => {
  let service: { coreStatus: jasmine.Spy; publishToCore: jasmine.Spy };

  function create(current: CorePublicationStatus = status(), publish = of({ payload: { data: status() } } as never)) {
    service = { coreStatus: jasmine.createSpy('coreStatus').and.returnValue(of({ payload: { data: current } } as never)), publishToCore: jasmine.createSpy('publishToCore').and.returnValue(publish) };
    TestBed.configureTestingModule({ imports: [ProfilesCoreComponent], providers: [provideNoopAnimations(), provideRouter([]), { provide: ProfilesService, useValue: service }] });
    const fixture = TestBed.createComponent(ProfilesCoreComponent);
    fixture.detectChanges();

    return fixture;
  }

  it('draws the last publication, what Core said of each own profile and the history', () => {
    const text = (create().nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Última publicación');
    expect(text).toContain('Pendiente');
    expect(text).toContain('Retirado');
    expect(text).toContain('Sin publicar');
    expect(text).toContain('Core no respondió.');
    expect(text).toContain('12 perfiles');
  });

  it('offers to retry when the last publication failed', () => {
    const text = (create(status({ last: failed, history: [failed] })).nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Reintentar');
  });

  it('publishes and shows the new state', () => {
    const fixture = create();

    fixture.componentInstance.publish();
    fixture.detectChanges();

    expect(service.publishToCore).toHaveBeenCalled();
    expect(fixture.componentInstance.justPublished()).toBeTrue();
    expect(fixture.componentInstance.publishing()).toBeFalse();
  });

  it('shows the reason when Core fails and reloads the history', () => {
    const fixture = create(status(), throwError(() => ({ error: { payload: { message: 'Core no respondió.', reason: 'core_error' } } })));

    fixture.componentInstance.publish();
    fixture.detectChanges();

    expect(fixture.componentInstance.publishError()).toBe('Core no respondió.');
    expect(service.coreStatus).toHaveBeenCalledTimes(2);
  });

  it('says there are no own profiles yet instead of an empty table', () => {
    const text = (create(status({ profiles: [], last: null, history: [] })).nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Todavía no hay perfiles propios');
    expect(text).toContain('Todavía no se publicó ningún perfil a Core.');
  });
});
