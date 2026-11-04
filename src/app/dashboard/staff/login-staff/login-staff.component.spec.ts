import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';

import { LoginStaffComponent } from './login-staff.component';

describe('LoginStaffComponent', () => {
  const create = (query: Record<string, string> = {}) => {
    TestBed.configureTestingModule({
      imports: [LoginStaffComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });
    const fixture = TestBed.createComponent(LoginStaffComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('should create', () => {
    expect(create().componentInstance).toBeTruthy();
  });

  it('shows no warning on a normal visit', () => {
    expect(create().nativeElement.querySelector('[data-testid="core-error"]')).toBeNull();
  });

  it('says why the sign-in with Core failed when the person comes back from Core without a session', () => {
    const fixture = create({ core_error: 'not_linked' });

    expect(fixture.nativeElement.querySelector('[data-testid="core-error"]').textContent).toContain('no está vinculada');
  });
});
