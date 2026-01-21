import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventValidateCertificateComponent } from './event-validate-certificate.component';

describe('EventValidateCertificateComponent', () => {
  let component: EventValidateCertificateComponent;
  let fixture: ComponentFixture<EventValidateCertificateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventValidateCertificateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventValidateCertificateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
