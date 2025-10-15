import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventAttendanceCheckInComponent } from './event-attendance-check-in.component';

describe('EventAttendanceCheckInComponent', () => {
  let component: EventAttendanceCheckInComponent;
  let fixture: ComponentFixture<EventAttendanceCheckInComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventAttendanceCheckInComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventAttendanceCheckInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
