import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { NotificationService } from '../../../../services/notification.service';
import { StudentModuleSwitch, StudentModulesService } from '../../../../services/student-modules.service';
import { StudentModulesComponent } from './student-modules.component';

const modules: StudentModuleSwitch[] = [
  { key: 'carnet', label: 'Carné universitario', description: 'Solicitud, foto y recojo del carné.', enabled: true },
  { key: 'dbu_appointments', label: 'Citas de Bienestar', description: 'Reservar citas.', enabled: false },
];

const ok = (data: unknown): never => of({ status: 'success', payload: { title: 'Listo', message: 'Hecho', data } }) as never;

describe('StudentModulesComponent', () => {
  it('lists the modules and switches one', async () => {
    const service = jasmine.createSpyObj<StudentModulesService>('StudentModulesService', ['list', 'setEnabled']);
    service.list.and.returnValue(ok({ modules }));
    service.setEnabled.and.returnValue(ok({ modules: [modules[0], { ...modules[1], enabled: true }] }));

    TestBed.configureTestingModule({
      imports: [StudentModulesComponent],
      providers: [provideNoopAnimations(), { provide: StudentModulesService, useValue: service }, { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']) }],
    });
    const fixture = TestBed.createComponent(StudentModulesComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent as string).toContain('Citas de Bienestar');

    fixture.componentInstance.toggle(modules[1], true);

    expect(service.setEnabled).toHaveBeenCalledWith('dbu_appointments', true);
    expect(fixture.componentInstance.modules()[1].enabled).toBeTrue();
  });
});
