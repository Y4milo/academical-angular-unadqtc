import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventDownloadCertificateComponent } from './event-download-certificate.component';

describe('EventDownloadCertificateComponent', () => {
  let component: EventDownloadCertificateComponent;
  let fixture: ComponentFixture<EventDownloadCertificateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventDownloadCertificateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventDownloadCertificateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
