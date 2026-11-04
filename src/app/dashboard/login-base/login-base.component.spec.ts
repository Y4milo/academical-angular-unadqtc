import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageService } from 'primeng/api';
import { LoginBaseComponent } from './login-base.component';

describe('LoginBaseComponent', () => {
  let component: LoginBaseComponent;
  let fixture: ComponentFixture<LoginBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginBaseComponent],
      providers: [MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows Academical, a divider and the UNADQTC logo in one centered line above the title', () => {
    const brand = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="login-brand"]') as HTMLElement;
    const style = getComputedStyle(brand);

    expect(brand.textContent).toContain('Academical');
    expect(brand.querySelector('img')?.getAttribute('alt')).toBe('UNADQTC');
    expect(style.flexDirection).toBe('row');
    expect(style.justifyContent).toBe('center');
  });

  it('sends one login per submit and none from Enter in the password field alone', async () => {
    const emitted = jasmine.createSpy('login');
    component.login.subscribe(emitted);
    const root = fixture.nativeElement as HTMLElement;
    component.user = 'ana';
    component.password = 'secret';
    fixture.detectChanges();
    await fixture.whenStable();

    root.querySelector('input[type="password"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(emitted).not.toHaveBeenCalled();

    root.querySelector('form')!.dispatchEvent(new Event('submit'));
    expect(emitted).toHaveBeenCalledTimes(1);
  });
});
