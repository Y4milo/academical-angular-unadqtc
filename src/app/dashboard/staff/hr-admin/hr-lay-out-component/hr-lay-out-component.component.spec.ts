import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrLayOutComponentComponent } from './hr-lay-out-component.component';

describe('HrLayOutComponentComponent', () => {
  let component: HrLayOutComponentComponent;
  let fixture: ComponentFixture<HrLayOutComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrLayOutComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrLayOutComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
