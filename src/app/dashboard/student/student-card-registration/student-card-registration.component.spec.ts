import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentCardRegistrationComponent } from './student-card-registration.component';

describe('StudentCardRegistrationComponent', () => {
  let component: StudentCardRegistrationComponent;
  let fixture: ComponentFixture<StudentCardRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentCardRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentCardRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
