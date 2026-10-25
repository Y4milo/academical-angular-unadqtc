import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ServiceOrdersService, fromIsoDate, toIsoDate } from './service-orders.service';

describe('ServiceOrdersService', () => {
  let service: ServiceOrdersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ServiceOrdersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('turns a local date into AAAA-MM-DD without shifting the day', () => {
    expect(toIsoDate(new Date(2026, 7, 31, 23, 30))).toBe('2026-08-31');
    expect(toIsoDate(null)).toBeNull();
  });

  it('reads AAAA-MM-DD as a local date', () => {
    const date = fromIsoDate('2026-08-31')!;
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 7, 31]);
    expect(fromIsoDate(null)).toBeNull();
  });

  it('asks the backend for a deliverable document as a blob', () => {
    service.download(7, 'conformity', 'pdf').subscribe();

    const request = http.expectOne(req => req.url.endsWith('/service-orders/deliverables/7/conformity/pdf'));
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['pdf'], { type: 'application/pdf' }));
  });
});
