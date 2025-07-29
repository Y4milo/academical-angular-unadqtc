import { Routes } from '@angular/router';
import { StudentCardRegistrationComponent } from './dashboard/student/student-card-registration/student-card-registration.component';
import {AuthGuardStudent} from './guards/auth-guard-student.service';
import {LoginStudentComponent} from './dashboard/student/login-student/login-student.component';
import {LoginAdminComponent} from './dashboard/admin/login-admin/login-admin.component';
import {StudentCardsComponent} from './dashboard/admin/academic/student-cards/student-cards.component';
import {AuthGuardAcademic} from './guards/auth-guard-academic-service';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginStudentComponent },
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
  { path: '**', redirectTo: 'login' }
];

