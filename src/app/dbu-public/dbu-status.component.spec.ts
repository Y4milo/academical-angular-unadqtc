import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DbuPublicAppointment, DbuPublicService, dbuErrorMessage } from './dbu-public.service';
import { DbuStatusComponent } from './dbu-status.component';

const appointment = (overrides: Partial<DbuPublicAppointment> = {}): DbuPublicAppointment => ({
  code: 'CT-4F7K2P', status: 'reserved', type: 'Psicología', date: '2026-10-22', time: '10:00', can_cancel: true, ...overrides,
});

const wrap = <T>(data: T) => of({ status: 'success', payload: { data } } as never);

describe('DbuStatusComponent', () => {
  const service = { status: jasmine.createSpy('status'), cancel: jasmine.createSpy('cancel') };

  beforeEach(async () => {
    service.status.calls.reset();
    service.cancel.calls.reset();
    await TestBed.configureTestingModule({
      imports: [DbuStatusComponent],
      providers: [provideNoopAnimations(), provideRouter([]), { provide: DbuPublicService, useValue: service }],
    }).compileComponents();
  });

  it('only searches with a well-formed code and a document', () => {
    const component = TestBed.createComponent(DbuStatusComponent).componentInstance;

    component.code = 'ABC';
    component.documentNumber = '71424933';
    expect(component.canSearch()).toBeFalse();

    component.code = 'ct-4f7k2p';
    expect(component.canSearch()).toBeTrue();
  });

  it('finds the appointment and sends the code in upper case', () => {
    service.status.and.returnValue(wrap(appointment()));
    const fixture = TestBed.createComponent(DbuStatusComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.code = 'ct-4f7k2p';
    component.documentNumber = '71424933';

    component.search();
    fixture.detectChanges();

    expect(service.status).toHaveBeenCalledWith({ code: 'CT-4F7K2P', document_number: '71424933' });
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="dbu-code"]')?.textContent).toContain('CT-4F7K2P');
  });

  it('asks for confirmation before cancelling and then shows the new status', () => {
    service.status.and.returnValue(wrap(appointment()));
    service.cancel.and.returnValue(wrap(appointment({ status: 'cancelled', can_cancel: false })));
    const fixture = TestBed.createComponent(DbuStatusComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.code = 'CT-4F7K2P';
    component.documentNumber = '71424933';
    component.search();

    component.askCancel();
    expect(service.cancel).not.toHaveBeenCalled();

    component.cancel();
    expect(service.cancel).toHaveBeenCalled();
    expect(component.appointment()?.status).toBe('cancelled');
    expect(component.label('cancelled')).toBe('Cancelada');
  });

  it('shows the API message when the appointment is not found', () => {
    service.status.and.returnValue(throwError(() => ({ error: { payload: { message: 'Revisa tu código y tu documento.' } } })));
    const component = TestBed.createComponent(DbuStatusComponent).componentInstance;
    component.code = 'CT-4F7K2P';
    component.documentNumber = '00000000';

    component.search();

    expect(component.error()).toBe('Revisa tu código y tu documento.');
    expect(dbuErrorMessage({})).toContain('No se pudo');
  });
});
