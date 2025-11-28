import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicLayOutComponentComponent } from './academic-lay-out-component.component';

describe('AcademicLayOutComponentComponent', () => {
  let component: AcademicLayOutComponentComponent;
  let fixture: ComponentFixture<AcademicLayOutComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicLayOutComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicLayOutComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
