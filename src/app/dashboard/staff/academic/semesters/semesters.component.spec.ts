import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SemestersComponent } from './semesters.component';
import { Semester, SemestersService } from '../../../../services/semesters.service';
import { NotificationService } from '../../../../services/notification.service';

const semester = (overrides: Partial<Semester>): Semester => ({
  id: 1, name: '2027-I', label: 'Semestre 2027-I', start_date: '2027-03-15', end_date: '2027-07-30', state: 'draft', card_start_date: null, card_end_date: null, ...overrides,
});

const ok = (semesters: Semester[]): never => of({ status: 'success', payload: { title: 'Listo', message: 'Hecho', data: { semesters } } }) as never;

describe('SemestersComponent', () => {
  let fixture: ComponentFixture<SemestersComponent>;
  let service: jasmine.SpyObj<SemestersService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<SemestersService>('SemestersService', ['list', 'create', 'update', 'enable', 'backToDraft']);
    service.list.and.returnValue(ok([semester({}), semester({ id: 2, name: '2026-I', state: 'finished' })]));

    await TestBed.configureTestingModule({
      imports: [SemestersComponent],
      providers: [
        provideNoopAnimations(),
        { provide: SemestersService, useValue: service },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SemestersComponent);
    fixture.detectChanges();
  });

  it('lists the semesters with their state', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('2027-I');
    expect(text).toContain('Borrador');
    expect(text).toContain('Finalizado');
  });

  it('only drafts and enabled semesters can be edited', () => {
    const component = fixture.componentInstance;
    expect(component.canEdit(semester({ state: 'draft' }))).toBeTrue();
    expect(component.canEdit(semester({ state: 'enabled' }))).toBeTrue();
    expect(component.canEdit(semester({ state: 'current' }))).toBeFalse();
    expect(component.canEdit(semester({ state: 'finished' }))).toBeFalse();
  });

  it('validates the form before calling the API', () => {
    const component = fixture.componentInstance;
    component.openCreate();
    component.name = '2027';
    component.save();
    expect(component.formError).toContain('2027-I');

    component.name = '2027-I';
    component.startDate = new Date(2027, 6, 30);
    component.endDate = new Date(2027, 2, 15);
    component.save();
    expect(component.formError).toContain('posterior');
    expect(service.create).not.toHaveBeenCalled();
  });

  it('creates a draft and refreshes the list', () => {
    service.create.and.returnValue(ok([semester({ id: 3, name: '2027-II' })]));
    const component = fixture.componentInstance;
    component.openCreate();
    component.name = '2027-II';
    component.startDate = new Date(2027, 7, 15);
    component.endDate = new Date(2027, 11, 15);
    component.save();

    expect(service.create).toHaveBeenCalledWith('2027-II', '2027-08-15', '2027-12-15');
    expect(component.semesters().length).toBe(1);
    expect(component.dialogVisible).toBeFalse();
  });

  it('enables a draft', () => {
    service.enable.and.returnValue(ok([semester({ state: 'enabled' })]));
    fixture.componentInstance.enable(semester({}));
    expect(service.enable).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.semesters()[0].state).toBe('enabled');
  });
});
