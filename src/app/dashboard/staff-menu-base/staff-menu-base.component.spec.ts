import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffMenuBaseComponent } from './staff-menu-base.component';

describe('StaffMenuBaseComponent', () => {
  let component: StaffMenuBaseComponent;
  let fixture: ComponentFixture<StaffMenuBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffMenuBaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffMenuBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
