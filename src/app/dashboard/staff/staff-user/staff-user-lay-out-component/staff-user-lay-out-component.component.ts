import {Component} from '@angular/core';
import {PATHS} from '../../../../core/constants/app-paths.constants';
import {StaffRoleLayoutComponent} from '../../shared/staff-role-layout/staff-role-layout.component';

@Component({
  selector: 'app-staff-user-lay-out-component',
  imports: [
    StaffRoleLayoutComponent,
  ],
  templateUrl: './staff-user-lay-out-component.component.html',
  styleUrl: './staff-user-lay-out-component.component.css'
})
export class StaffUserLayOutComponentComponent {
  protected readonly attendanceRouterLink = PATHS.staff.home.path;
}
