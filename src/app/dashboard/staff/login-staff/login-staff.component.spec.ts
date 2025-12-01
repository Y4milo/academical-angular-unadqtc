import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginStaffComponent } from './login-staff.component';

describe('LoginStaffComponent', () => {
  let component: LoginStaffComponent;
  let fixture: ComponentFixture<LoginStaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginStaffComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
