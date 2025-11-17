import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrReportAttendanceComponentComponent } from './hr-report-attendance-component.component';

describe('HrReportAttendanceComponentComponent', () => {
  let component: HrReportAttendanceComponentComponent;
  let fixture: ComponentFixture<HrReportAttendanceComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrReportAttendanceComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrReportAttendanceComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
