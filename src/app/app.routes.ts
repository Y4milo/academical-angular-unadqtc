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


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginStudentComponent },
  {
    path: 'hr',
    // canActivate: [AuthGuardStaff], // ⛔ Protege todo lo que esté dentro
    component: HrLayOutComponentComponent,
    children: [
      {
        path: '',
        component: HrHomeComponent
      },
      {
        path: 'staff/attendance',
        component: AttendanceListComponent
      },
      {
        path: 'staff/attendance/reports',
        component: HrReportAttendanceComponentComponent
      },
    ]
  },
  {
    path: 'staff/attendance-user',
    component: AttendanceUserComponent,
    canActivate: [AuthGuardStaff] // ⛔ Protege la ruta
  },
  {
    path: 'student-card-registration',
    component: StudentCardRegistrationComponent,
    canActivate: [AuthGuardStudent] // ⛔ Protege la ruta
  },
  {
    path: 'admin/student-cards',
    component: StudentCardsComponent,
    canActivate: [AuthGuardAcademic] // ⛔ Protege la ruta
  },
  { path: 'login-admin', component: LoginAdminComponent },
  {
    path: 'kanchay/register-participant',
    component: RegisterParticipantComponent,
  },
  {
    path: 'kanchay/event-attendance-check-in/:id',
    component: EventAttendanceCheckInComponent,
  },
  {
    path: 'kanchay/event-question-check-out/:id',
    component: EventQuestionsWithCheckOutComponent,
  },
  {
    path: '**', redirectTo: 'login'
  }
];

