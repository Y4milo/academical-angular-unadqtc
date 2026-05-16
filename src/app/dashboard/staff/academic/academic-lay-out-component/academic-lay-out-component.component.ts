import {Component} from '@angular/core';
import {PATHS} from '../../../../core/constants/app-paths.constants';
import {StaffRoleLayoutComponent} from '../../shared/staff-role-layout/staff-role-layout.component';

@Component({
  standalone: true,
  selector: 'app-academic-lay-out-component',
  imports: [
    StaffRoleLayoutComponent,
  ],
  templateUrl: './academic-lay-out-component.component.html',
  styleUrl: './academic-lay-out-component.component.css'
})
export class AcademicLayOutComponentComponent {
  protected readonly attendanceRouterLink = PATHS.academic.home.path;
}
