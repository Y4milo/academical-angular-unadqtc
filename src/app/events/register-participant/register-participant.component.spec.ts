import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterParticipantComponent } from './register-participant.component';

describe('RegisterParticipantComponent', () => {
  let component: RegisterParticipantComponent;
  let fixture: ComponentFixture<RegisterParticipantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterParticipantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterParticipantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
