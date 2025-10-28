import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceUserComponent } from './attendance-user.component';

describe('AttendanceUserComponent', () => {
  let component: AttendanceUserComponent;
  let fixture: ComponentFixture<AttendanceUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendanceUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
