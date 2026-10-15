import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DbuConfigService } from './dbu-config.service';

describe('DbuConfigService', () => {
  let service: DbuConfigService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DbuConfigService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the whole configuration', () => {
    service.config().subscribe();
    const request = http.expectOne(candidate => candidate.url.endsWith('/dbu/config'));

    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('sends only the changed settings', () => {
    service.updateSettings({ offer_minutes: 20 }).subscribe();
    const request = http.expectOne(candidate => candidate.url.endsWith('/dbu/config/settings'));

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ offer_minutes: 20 });
    request.flush({});
  });

  it('creates and updates attendants and types', () => {
    service.addAttendant({ user_id: 7, weekdays: ['mon'], start_time: '08:00', end_time: '15:00', type_ids: [1] }).subscribe();
    const created = http.expectOne(candidate => candidate.url.endsWith('/dbu/config/attendants'));
    expect(created.request.method).toBe('POST');
    created.flush({});

    service.updateAttendant(3, { is_active: false }).subscribe();
    const updated = http.expectOne(candidate => candidate.url.endsWith('/dbu/config/attendants/3'));
    expect(updated.request.method).toBe('PATCH');
    updated.flush({});

    service.addType({ code: 'vocational', name: 'Orientación vocacional' }).subscribe();
    http.expectOne(candidate => candidate.url.endsWith('/dbu/config/types')).flush({});

    service.updateType(2, { is_active: false }).subscribe();
    http.expectOne(candidate => candidate.url.endsWith('/dbu/config/types/2')).flush({});
  });

  it('asks for the change log with a limit', () => {
    service.logs(20).subscribe();
    const request = http.expectOne(candidate => candidate.url.endsWith('/dbu/config/logs'));

    expect(request.request.params.get('limit')).toBe('20');
    request.flush({});
  });
});
