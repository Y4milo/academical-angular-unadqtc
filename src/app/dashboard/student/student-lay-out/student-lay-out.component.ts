import {Component} from '@angular/core';
import {StaffRoleLayoutComponent} from '../../staff/shared/staff-role-layout/staff-role-layout.component';

/** Contenedor del estudiante: la misma barra lateral del personal, con el menú de sus módulos. */
@Component({
  standalone: true,
  selector: 'app-student-lay-out',
  imports: [StaffRoleLayoutComponent],
  template: `<app-staff-role-layout audience="student" [loadRemoteMenu]="false"></app-staff-role-layout>`,
})
export class StudentLayOutComponent {}
