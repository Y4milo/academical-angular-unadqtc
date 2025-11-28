import { Routes } from '@angular/router';
import { StudentCardRegistrationComponent } from './dashboard/student/student-card-registration/student-card-registration.component';
import {AuthGuardStudent} from './guards/auth-guard-student.service';
import {LoginStudentComponent} from './dashboard/student/login-student/login-student.component';
import {LoginAdminComponent} from './dashboard/staff/login-admin/login-admin.component';
import {StudentCardsComponent} from './dashboard/staff/academic/student-cards/student-cards.component';
import {AuthGuardAcademic} from './guards/auth-guard-academic-service';
import {RegisterParticipantComponent} from './events/register-participant/register-participant.component';
import {EventAttendanceCheckInComponent} from './events/event-attendance-check-in/event-attendance-check-in.component';
import {
  EventQuestionsWithCheckOutComponent
} from './events/event-questions-with-check-out/event-questions-with-check-out.component';
import {AttendanceListComponent} from './dashboard/staff/hr-admin/attendace-admin/attendance.component';
import {AttendanceUserComponent} from './dashboard/staff/attendance-user/attendance-user.component';
import {AuthGuardStaff} from './guards/auth-guard-staff-service';
import {HrHomeComponent} from './dashboard/staff/hr-admin/hr-home/hr-home.component';
import {
  HrLayOutComponentComponent
} from './dashboard/staff/hr-admin/hr-lay-out-component/hr-lay-out-component.component';
import {
  HrReportAttendanceComponentComponent
} from './dashboard/staff/hr-admin/hr-report-attendance-component/hr-report-attendance-component.component';
import {paths} from './core/constants/paths';
import {
  AcademicLayOutComponentComponent
} from './dashboard/staff/academic/academic-lay-out-component/academic-lay-out-component.component';
import {StudentRankingComponent} from './dashboard/staff/academic/student-ranking/student-ranking.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: paths.login.staff,
    pathMatch: 'full'
  },
  {
    path: paths.login.student,
    component: LoginStudentComponent
  },
  {
    path: paths.login.staff,
    component: LoginAdminComponent
  },
  {
    path: paths.hr.path,
    canActivate: [AuthGuardStaff], // ⛔ Protege todo lo que esté dentro
    component: HrLayOutComponentComponent,
    children: [
      {
        path: paths.hr.staff.attendance.home.route,
        component: HrHomeComponent
      },
      {
        path: paths.hr.staff.attendance.list.route,
        component: AttendanceListComponent
      },
      {
        path: paths.hr.staff.attendance.reports.route,
        component: HrReportAttendanceComponentComponent
      },
    ]
  },
  {
    path: paths.staff.user,
    component: AttendanceUserComponent,
    canActivate: [AuthGuardStaff] // ⛔ Protege la ruta
  },
  {
    path: paths.student.card.registration,
    component: StudentCardRegistrationComponent,
    canActivate: [AuthGuardStudent] // ⛔ Protege la ruta
  },
  {
    path: paths.academic.path,
    component: AcademicLayOutComponentComponent,
    canActivate: [AuthGuardAcademic], // ⛔ Protege la ruta
    children: [
      {
        path: paths.academic.home.route,
        component: AttendanceUserComponent
      },
      {
        path: paths.academic.student.card.panel.route,
        component: StudentCardsComponent
      },
      {
        path: paths.academic.student.ranking.route,
        component: StudentRankingComponent
      },
    ]
  },
  {
    path: paths.event.participant.register,
    component: RegisterParticipantComponent,
  },
  {
    path: paths.event.attendance.check_in,
    component: EventAttendanceCheckInComponent,
  },
  {
    path: paths.event.attendance.check_in,
    component: EventQuestionsWithCheckOutComponent,
  },
  {
    path: '**', redirectTo: paths.login.staff
  }
];

