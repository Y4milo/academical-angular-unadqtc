import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DirectiveEvent } from '../../../../services/directives.service';
import { DirectiveTrackingComponent } from './directive-tracking.component';

@Component({
  imports: [DirectiveTrackingComponent],
  template: '<app-directive-tracking [events]="events()" emptyText="Sin movimientos aún." [(open)]="open"></app-directive-tracking>',
})
class HostComponent {
  readonly events = signal<DirectiveEvent[]>([]);
  readonly open = signal(false);
}

describe('DirectiveTrackingComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  const find = (testId: string) => fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) ?? document.body.querySelector(`[data-testid="${testId}"]`);
  const event = (type: string, data: Record<string, unknown> = {}): DirectiveEvent => ({ type, version: 1, at: '2026-11-10T18:37:00Z', by: { id: 1, nick: 'yp', name: 'Yamil Peña', office: 'OTI' }, data });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideNoopAnimations()] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('shows a small button with the number of movements and the drawer closed', () => {
    fixture.componentInstance.events.set([event('created'), event('edited', { changes: { title: { before: 'A', after: 'B' } } })]);
    fixture.detectChanges();

    expect(find('tracking-button')!.textContent).toContain('Seguimiento');
    expect(find('tracking-count')!.textContent!.trim()).toBe('2');
    expect(find('tracking-button')!.getAttribute('aria-expanded')).toBe('false');
    expect(find('directive-event')).toBeNull();
  });

  it('opens the drawer with who, where, when and the before and after of each change', async () => {
    fixture.componentInstance.events.set([event('edited', { changes: { title: { before: 'A', after: 'B' } } })]);
    find('tracking-button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.open()).toBeTrue();
    expect(find('directive-event')!.textContent).toContain('Corrigió los datos');
    expect(find('directive-event')!.textContent).toContain('Yamil Peña · OTI');
    expect(find('event-change')!.textContent).toContain('Título');
    expect(find('event-change')!.textContent).toContain('A');
    expect(find('event-change')!.textContent).toContain('B');
  });

  it('says there is nothing yet when the directive has no movements', async () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(find('tracking-count')!.textContent!.trim()).toBe('0');
    expect(find('tracking-empty')!.textContent).toContain('Sin movimientos aún.');
  });
});
