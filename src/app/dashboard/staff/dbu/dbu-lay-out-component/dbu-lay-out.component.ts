import {Component} from '@angular/core';
import {StaffRoleLayoutComponent} from '../../shared/staff-role-layout/staff-role-layout.component';

/** Marco del rol de Bienestar Universitario (DBU): menú del rol y espacio para sus pantallas. */
@Component({
  selector: 'app-dbu-lay-out',
  imports: [StaffRoleLayoutComponent],
  template: '<app-staff-role-layout></app-staff-role-layout>',
})
export class DbuLayOutComponent {}
