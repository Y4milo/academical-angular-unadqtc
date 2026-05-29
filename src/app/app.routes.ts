import { Routes } from '@angular/router';
import { StudentCardRegistrationComponent } from './dashboard/student/student-card-registration/student-card-registration.component';
import {LoginStudentComponent} from './dashboard/student/login-student/login-student.component';
import {LoginStaffComponent} from './dashboard/staff/login-staff/login-staff.component';
import {StudentCardsComponent} from './dashboard/staff/academic/student-cards/student-cards.component';
import {RegisterParticipantComponent} from './events/register-participant/register-participant.component';
import {EventAttendanceCheckInComponent} from './events/event-attendance-check-in/event-attendance-check-in.component';
import {
  EventQuestionsWithCheckOutComponent
} from './events/event-questions-with-check-out/event-questions-with-check-out.component';
import {AttendanceListComponent} from './dashboard/staff/hr-admin/attendace-admin/attendance.component';
import {AttendanceUserComponent} from './dashboard/staff/staff-user/attendance-user/attendance-user.component';
import {
  HrLayOutComponentComponent
} from './dashboard/staff/hr-admin/hr-lay-out-component/hr-lay-out-component.component';
import {
  HrReportAttendanceComponentComponent
} from './dashboard/staff/hr-admin/hr-report-attendance-component/hr-report-attendance-component.component';
import {PATHS} from './core/constants/app-paths.constants';
import {ROLE} from './core/constants/app-roles.constants';
import {
  AcademicLayOutComponentComponent
} from './dashboard/staff/academic/academic-lay-out-component/academic-lay-out-component.component';
import {StudentRankingComponent} from './dashboard/staff/academic/student-ranking/student-ranking.component';
import {ApprovedAverageComponent} from './dashboard/staff/academic/approved-average/approved-average.component';
import {
  StaffUserLayOutComponentComponent
} from './dashboard/staff/staff-user/staff-user-lay-out-component/staff-user-lay-out-component.component';
import {
  EventDownloadCertificateComponent
} from './events/event-download-certificate/event-download-certificate.component';
import {
  EventValidateCertificateComponent
} from './events/event-validate-certificate/event-validate-certificate.component';
import {StaffMenuBaseComponent} from './dashboard/staff-menu-base/staff-menu-base.component';
import {AuthRoleGuard} from './guards/auth-role.guard';
import {AuthStudentGuard} from './guards/auth-student.guard';

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
    path: PATHS.admin.path,
    canActivate: [AuthRoleGuard],
    data: {roles: [ROLE.admin]},
    component: StaffMenuBaseComponent,
    children: [
      {
        path: '',
        redirectTo: PATHS.admin.home.path,
        pathMatch: 'full'
      },
      {
        path: PATHS.admin.home.path,
        component: AttendanceUserComponent
      },
      {
        path: PATHS.hr.staff.attendance.list.path,
        component: AttendanceListComponent
      },
      {
        path: PATHS.hr.staff.attendance.reports.path,
        component: HrReportAttendanceComponentComponent
      },
      {
        path: PATHS.academic.student.card.panel.path,
        component: StudentCardsComponent
      },
      {
        path: PATHS.academic.student.ranking.path,
        component: StudentRankingComponent
      },
      {
        path: PATHS.academic.student.approvedAverage.path,
        component: ApprovedAverageComponent
      },
    ]
  },
  {
    path: PATHS.hr.path,
    canActivate: [AuthRoleGuard],
    data: {roles: [ROLE.hr]},
    component: HrLayOutComponentComponent,
    children: [
      {
        path: PATHS.hr.home.path,
        component: AttendanceUserComponent
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
    canActivate: [AuthRoleGuard],
    data: {roles: [ROLE.professor, ROLE.administrative]},
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
    canActivate: [AuthStudentGuard]
  },
  {
    path: PATHS.academic.path,
    component: AcademicLayOutComponentComponent,
    canActivate: [AuthRoleGuard],
    data: {roles: [ROLE.academic]},
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
      {
        path: PATHS.academic.student.approvedAverage.path,
        component: ApprovedAverageComponent
      },
    ]
  },
  {
    path: PATHS.event.path,
    children: [
      {
        path: PATHS.event.participant.register,
        component: RegisterParticipantComponent,
      },
      {
        path: PATHS.event.attendance.path,
        children: [
          {
            path: PATHS.event.attendance.check_in,
            component: EventAttendanceCheckInComponent,
          },
          {
            path: PATHS.event.attendance.check_out,
            component: EventQuestionsWithCheckOutComponent,
          }
        ]
      },
      {
        path: PATHS.event.certification.download,
        component: EventDownloadCertificateComponent,
      },
      {
        path: PATHS.event.certification.validate,
        component: EventValidateCertificateComponent,
      }
    ]
  },
  // {
  //   path: PATHS.event.participant.register,
  //   component: RegisterParticipantComponent,
  // },
  // {
  //   path: PATHS.event.attendance.check_in,
  //   component: EventAttendanceCheckInComponent,
  // },
  // {
  //   path: PATHS.event.attendance.check_out,
  //   component: EventQuestionsWithCheckOutComponent,
  // },
  {
    path: '**', redirectTo: PATHS.login.staff
  }
];

