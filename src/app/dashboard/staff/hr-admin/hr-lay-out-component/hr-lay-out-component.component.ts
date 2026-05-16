import {Component} from '@angular/core';
import {PATHS} from '../../../../core/constants/app-paths.constants';
import {StaffRoleLayoutComponent} from '../../shared/staff-role-layout/staff-role-layout.component';

@Component({
  selector: 'app-hr-lay-out-component',
  imports: [
    StaffRoleLayoutComponent,
  ],
  templateUrl: './hr-lay-out-component.component.html',
  styleUrl: './hr-lay-out-component.component.css'
})
export class HrLayOutComponentComponent {
  protected readonly attendanceRouterLink = PATHS.hr.home.path;
}
