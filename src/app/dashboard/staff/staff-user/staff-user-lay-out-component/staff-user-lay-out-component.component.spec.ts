import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffUserLayOutComponentComponent } from './staff-user-lay-out-component.component';

describe('StaffUserLayOutComponentComponent', () => {
  let component: StaffUserLayOutComponentComponent;
  let fixture: ComponentFixture<StaffUserLayOutComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffUserLayOutComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffUserLayOutComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
