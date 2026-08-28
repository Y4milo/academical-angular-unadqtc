import {Component} from '@angular/core';
import {StaffRoleLayoutComponent} from '../shared/staff-role-layout/staff-role-layout.component';

@Component({
  selector: 'app-degrees-titles-layout',
  imports: [StaffRoleLayoutComponent],
  template: `<app-staff-role-layout></app-staff-role-layout>`,
})
export class DegreesTitlesLayoutComponent {}
