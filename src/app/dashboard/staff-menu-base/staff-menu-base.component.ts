import {Component} from '@angular/core';
import {PATHS} from '../../core/constants/app-paths.constants';
import {StaffRoleLayoutComponent} from '../staff/shared/staff-role-layout/staff-role-layout.component';

@Component({
  selector: 'app-staff-menu-base',
  imports: [
    StaffRoleLayoutComponent,
  ],
  templateUrl: './staff-menu-base.component.html',
  styleUrl: './staff-menu-base.component.css'
})
export class StaffMenuBaseComponent {
  protected readonly attendanceRouterLink = PATHS.admin.home.path;
}
