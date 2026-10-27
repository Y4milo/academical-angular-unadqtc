import { Injectable, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { PATHS } from '../../../core/constants/app-paths.constants';
import { StudentModuleEntry, StudentModuleKey, StudentModulesService } from '../../../services/student-modules.service';

export type StudentMenuStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Un módulo sin pantalla todavía (las citas desde la cuenta) no aparece aunque esté activado. */
const MODULE_ROUTES: Partial<Record<StudentModuleKey, { link: string; icon: string }>> = {
  carnet: { link: `/${PATHS.student.card.registration}`, icon: 'id-card' },
};

/** Grupo del menú lateral del estudiante con sus módulos, el que contiene la pantalla actual abierto. */
export function buildStudentMenu(modules: StudentModuleEntry[]): MenuItem[] {
  const items = modules
    .filter(module => MODULE_ROUTES[module.key] !== undefined)
    .map(module => ({ label: module.label, icon: MODULE_ROUTES[module.key]!.icon, routerLink: MODULE_ROUTES[module.key]!.link }));

  return items.length === 0 ? [] : [{ label: 'Mis trámites', icon: 'layout-grid', expanded: true, items }];
}

/** Módulos del estudiante conectado: se cargan una vez por sesión y alimentan el menú lateral. */
@Injectable({ providedIn: 'root' })
export class StudentMenuStore {
  private readonly service = inject(StudentModulesService);

  readonly modules = signal<StudentModuleEntry[]>([]);
  readonly name = signal('');
  readonly status = signal<StudentMenuStatus>('idle');

  load(force = false): void {
    if (this.status() === 'loading' || (!force && this.status() === 'ready')) {
      return;
    }

    this.status.set('loading');
    this.service.mine().subscribe({
      next: response => {
        this.modules.set(response.payload.data?.modules ?? []);
        this.name.set(response.payload.data?.student.name ?? '');
        this.status.set('ready');
      },
      error: () => {
        this.modules.set([]);
        this.status.set('error');
      },
    });
  }

  clear(): void {
    this.modules.set([]);
    this.name.set('');
    this.status.set('idle');
  }
}
