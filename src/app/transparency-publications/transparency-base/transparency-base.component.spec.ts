import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransparencyBaseComponent } from './transparency-base.component';

describe('TransparencyBaseComponent', () => {
  let component: TransparencyBaseComponent;
  let fixture: ComponentFixture<TransparencyBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransparencyBaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransparencyBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
