import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { DirectivesService } from './directives.service';

describe('DirectivesService', () => {
  let service: DirectivesService;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DirectivesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks the access that Core gives and lists with an optional status', () => {
    service.access().subscribe();
    http.expectOne(`${api}/directives/access`).flush({});

    service.list().subscribe();
    const all = http.expectOne(request => request.url === `${api}/directives`);
    expect(all.request.params.has('status')).toBeFalse();
    all.flush({});

    service.list('draft').subscribe();
    const drafts = http.expectOne(request => request.url === `${api}/directives`);
    expect(drafts.request.params.get('status')).toBe('draft');
    drafts.flush({});
  });

  it('creates and corrects with a form body (the files travel as multipart) and deletes by id', () => {
    const body = new FormData();
    body.append('title', 'Directiva');

    service.create(body).subscribe();
    const create = http.expectOne(`${api}/directives`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toBe(body);
    create.flush({});

    service.update(7, body).subscribe();
    const update = http.expectOne(`${api}/directives/7`);
    expect(update.request.method).toBe('POST');
    update.flush({});

    service.remove(7).subscribe();
    expect(http.expectOne(`${api}/directives/7`).request.method).toBe('DELETE');
  });

  it('sends a draft to signature with a POST on its own address', () => {
    service.send(7).subscribe();
    const request = http.expectOne(`${api}/directives/7/send`);

    expect(request.request.method).toBe('POST');
    request.flush({});
  });

  it('asks the route with the office and the quality flag as 1 or 0', () => {
    service.route('adm', true).subscribe();
    const yes = http.expectOne(request => request.url === `${api}/directives/route`);
    expect(yes.request.params.get('origin')).toBe('adm');
    expect(yes.request.params.get('quality')).toBe('1');
    yes.flush({});

    service.route('adm', false).subscribe();
    const no = http.expectOne(request => request.url === `${api}/directives/route`);
    expect(no.request.params.get('quality')).toBe('0');
    no.flush({});
  });

  it('downloads a file as a blob', () => {
    service.file(7, 'resolution').subscribe();
    const request = http.expectOne(`${api}/directives/7/files/resolution`);

    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['%PDF']));
  });
});
