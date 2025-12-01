import { Routes } from '@angular/router';
import { StudentCardRegistrationComponent } from './dashboard/student/student-card-registration/student-card-registration.component';
import {AuthGuardStudent} from './guards/auth-guard-student.service';
import {LoginStudentComponent} from './dashboard/student/login-student/login-student.component';
import {LoginStaffComponent} from './dashboard/staff/login-staff/login-staff.component';
import {StudentCardsComponent} from './dashboard/staff/academic/student-cards/student-cards.component';
import {AuthGuardAcademic} from './guards/auth-guard-academic-service';
import {RegisterParticipantComponent} from './events/register-participant/register-participant.component';
import {EventAttendanceCheckInComponent} from './events/event-attendance-check-in/event-attendance-check-in.component';
import {
  EventQuestionsWithCheckOutComponent
} from './events/event-questions-with-check-out/event-questions-with-check-out.component';
import {AttendanceListComponent} from './dashboard/staff/hr-admin/attendace-admin/attendance.component';
import {AttendanceUserComponent} from './dashboard/staff/staff-user/attendance-user/attendance-user.component';
import {AuthGuardStaff} from './guards/auth-guard-staff-service';
import {HrHomeComponent} from './dashboard/staff/hr-admin/hr-home/hr-home.component';
import {
  HrLayOutComponentComponent
} from './dashboard/staff/hr-admin/hr-lay-out-component/hr-lay-out-component.component';
import {
  HrReportAttendanceComponentComponent
} from './dashboard/staff/hr-admin/hr-report-attendance-component/hr-report-attendance-component.component';
import {PATHS} from './core/constants/paths';
import {
  AcademicLayOutComponentComponent
} from './dashboard/staff/academic/academic-lay-out-component/academic-lay-out-component.component';
import {StudentRankingComponent} from './dashboard/staff/academic/student-ranking/student-ranking.component';
import {AuthGuardHr} from './guards/auth-guard-hr-service';
import {
  StaffUserLayOutComponentComponent
} from './dashboard/staff/staff-user/staff-user-lay-out-component/staff-user-lay-out-component.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: PATHS.login.staff,
    pathMatch: 'full'
  },
  {
    path: PATHS.login.student,
    component: LoginStudentComponent
  },
  {
    path: PATHS.login.staff,
    component: LoginStaffComponent
  },
  {
    path: PATHS.hr.path,
    canActivate: [AuthGuardHr],
    component: HrLayOutComponentComponent,
    children: [
      {
        path: PATHS.hr.home.path,
        component: HrHomeComponent
      },
      {
        path: PATHS.hr.staff.attendance.list.path,
        component: AttendanceListComponent
      },
      {
        path: PATHS.hr.staff.attendance.reports.path,
        component: HrReportAttendanceComponentComponent
      },
    ]
  },
  {
    path: PATHS.staff.path,
    component: StaffUserLayOutComponentComponent,
    canActivate: [AuthGuardStaff],
    children: [
      {
        path: PATHS.staff.home.path,
        component: AttendanceUserComponent
      },
    ]
  },
  {
    path: PATHS.student.card.registration,
    component: StudentCardRegistrationComponent,
    canActivate: [AuthGuardStudent]
  },
  {
    path: PATHS.academic.path,
    component: AcademicLayOutComponentComponent,
    canActivate: [AuthGuardAcademic],
    children: [
      {
        path: PATHS.academic.home.path,
        component: AttendanceUserComponent
      },
      {
        path: PATHS.academic.student.card.panel.path,
        component: StudentCardsComponent
      },
      {
        path: PATHS.academic.student.ranking.path,
        component: StudentRankingComponent
      },
    ]
  },
  {
    path: PATHS.event.participant.register,
    component: RegisterParticipantComponent,
  },
  {
    path: PATHS.event.attendance.check_in,
    component: EventAttendanceCheckInComponent,
  },
  {
    path: PATHS.event.attendance.check_out,
    component: EventQuestionsWithCheckOutComponent,
  },
  {
    path: '**', redirectTo: PATHS.login.staff
  }
];

