import { Routes } from '@angular/router';
import {PATHS} from './core/constants/app-paths.constants';
import {ROLE} from './core/constants/app-roles.constants';
import {AuthRoleGuard} from './guards/auth-role.guard';
import {AuthStudentGuard} from './guards/auth-student.guard';

export const routes: Routes = [
  {path: 'grados-titulos/variables-etnicas/:token', loadComponent: () => import('./degrees-titles/public-ethnicity-form.component').then(m => m.PublicEthnicityFormComponent)},
  {path: 'soporte/correo', loadComponent: () => import('./support/public-support-request.component').then(m => m.PublicSupportRequestComponent)},
  // Los primeros enlaces de citas eran /citas; siguen funcionando y llevan al módulo.
  {path: 'citas', redirectTo: PATHS.dbu.booking.link, pathMatch: 'full'},
  {path: 'citas/estado', redirectTo: PATHS.dbu.status.link, pathMatch: 'full'},
  {
    path: '',
    redirectTo: PATHS.login.staff,
    pathMatch: 'full'
  },
  {
    path: PATHS.login.student,
    loadComponent: () => import('./dashboard/student/login-student/login-student.component').then(m => m.LoginStudentComponent)
  },
  {
    path: PATHS.login.staff,
    loadComponent: () => import('./dashboard/staff/login-staff/login-staff.component').then(m => m.LoginStaffComponent)
  },
  {
    path: PATHS.admin.path,
    canActivate: [AuthRoleGuard],
    data: {roles: [ROLE.admin]},
    loadComponent: () => import('./dashboard/staff-menu-base/staff-menu-base.component').then(m => m.StaffMenuBaseComponent),
    children: [
      {
        path: '',
        redirectTo: PATHS.admin.home.path,
        pathMatch: 'full'
      },
      {
        path: PATHS.admin.home.path,
        loadComponent: () => import('./dashboard/staff/staff-user/attendance-user/attendance-user.component').then(m => m.AttendanceUserComponent)
      },
      {
        path: PATHS.hr.staff.attendance.list.path,
        loadComponent: () => import('./dashboard/staff/hr-admin/attendace-admin/attendance.component').then(m => m.AttendanceListComponent)
      },
      {
        path: PATHS.hr.staff.attendance.register.path,
        loadComponent: () => import('./dashboard/staff/hr-admin/attendance-register/attendance-register.component').then(m => m.AttendanceRegisterComponent)
      },
      {
        path: PATHS.hr.staff.attendance.manual.path,
        loadComponent: () => import('./dashboard/staff/hr-admin/attendance-manual-list/attendance-manual-list.component').then(m => m.AttendanceManualListComponent)
      },
      {
        path: PATHS.hr.staff.attendance.reports.path,
        loadComponent: () => import('./dashboard/staff/hr-admin/hr-report-attendance-component/hr-report-attendance-component.component').then(m => m.HrReportAttendanceComponentComponent)
      },
      {
        path: PATHS.admin.academic.semesters.path,
        loadComponent: () => import('./dashboard/staff/academic/semesters/semesters.component').then(m => m.SemestersComponent)
      },
      {
        path: PATHS.admin.academic.cardSettings.path,
        loadComponent: () => import('./dashboard/staff/academic/student-card-settings/student-card-settings.component').then(m => m.StudentCardSettingsComponent)
      },
      {
        path: PATHS.academic.student.card.panel.path,
        loadComponent: () => import('./dashboard/staff/academic/student-cards/student-cards.component').then(m => m.StudentCardsComponent)
      },
      {
        path: PATHS.academic.student.ranking.path,
        loadComponent: () => import('./dashboard/staff/academic/student-ranking/student-ranking.component').then(m => m.StudentRankingComponent)
      },
      {
        path: PATHS.academic.student.approvedAverage.path,
        loadComponent: () => import('./dashboard/staff/academic/approved-average/approved-average.component').then(m => m.ApprovedAverageComponent)
      },
      {
        path: PATHS.admin.dbu.queue.path,
        loadComponent: () => import('./dashboard/staff/dbu/dbu-queue/dbu-queue.component').then(m => m.DbuQueueComponent)
      },
      {
        path: PATHS.admin.dbu.config.path,
        loadComponent: () => import('./dashboard/staff/dbu/dbu-config/dbu-config.component').then(m => m.DbuConfigComponent)
      },
      {
        path: PATHS.admin.serviceOrders.path,
        loadComponent: () => import('./dashboard/staff/service-orders/service-orders-list/service-orders-list.component').then(m => m.ServiceOrdersListComponent)
      },
      {
        path: PATHS.admin.serviceOrders.newOrder.path,
        loadComponent: () => import('./dashboard/staff/service-orders/service-order-form/service-order-form.component').then(m => m.ServiceOrderFormComponent)
      },
      {
        path: PATHS.admin.serviceOrders.config.path,
        loadComponent: () => import('./dashboard/staff/service-orders/service-orders-config/service-orders-config.component').then(m => m.ServiceOrdersConfigComponent)
      },
      {
        path: PATHS.admin.serviceOrders.detailPath,
        loadComponent: () => import('./dashboard/staff/service-orders/service-order-detail/service-order-detail.component').then(m => m.ServiceOrderDetailComponent)
      },
      {
        path: PATHS.admin.components.path,
        loadComponent: () => import('./dashboard/staff/shared/components-catalog/components-catalog.component').then(m => m.ComponentsCatalogComponent)
      },
      {
        path: PATHS.admin.users.accounts.path,
        loadComponent: () => import('./dashboard/staff/users/user-accounts/user-accounts.component').then(m => m.UserAccountsComponent)
      },
      {
        path: PATHS.admin.users.cases.path,
        loadComponent: () => import('./dashboard/staff/users/user-cases/user-cases.component').then(m => m.UserCasesComponent)
      },
      {
        path: PATHS.admin.users.accounts.sheetPath,
        loadComponent: () => import('./dashboard/staff/users/user-accounts/user-account-sheet.component').then(m => m.UserAccountSheetComponent)
      },
      {
        path: PATHS.admin.accounting.bank.incidents.path,
        loadComponent: () => import('./dashboard/staff/accounting/bn-incidents/bn-incidents.component').then(m => m.BnIncidentsComponent)
      },
      {
        path: PATHS.admin.accounting.bank.config.path,
        loadComponent: () => import('./dashboard/staff/accounting/bn-config/bn-config.component').then(m => m.BnConfigComponent)
      },
      {
        path: PATHS.admin.accounting.bank.traces.path,
        loadComponent: () => import('./dashboard/staff/accounting/bn-traces/bn-traces.component').then(m => m.BnTracesComponent)
      },
      {
        path: PATHS.admin.accounting.bank.files.path,
        loadComponent: () => import('./dashboard/staff/accounting/bn-files/bn-files.component').then(m => m.BnFilesComponent)
      },
      {
        path: PATHS.admin.degreesTitles.generalData.path,
        loadComponent: () => import('./dashboard/staff/degrees-titles/degree-general-data.component').then(m => m.DegreeGeneralDataComponent),
      },
      {
        path: PATHS.admin.degreesTitles.calls.path,
        loadComponent: () => import('./dashboard/staff/degrees-titles/degree-calls.component').then(m => m.DegreeCallsComponent),
      },
      {
        path: PATHS.admin.degreesTitles.records.path,
        loadComponent: () => import('./dashboard/staff/degrees-titles/degree-records.component').then(m => m.DegreeRecordsComponent),
      },
      {
        path: PATHS.admin.degreesTitles.exports.path,
        loadComponent: () => import('./dashboard/staff/degrees-titles/degrees-titles-page.component').then(m => m.DegreesTitlesPageComponent),
        data: {title: 'Exportaciones SUNEDU'},
      },
      {
        path: 'support/requests',
        loadComponent: () => import('./support/support-requests-admin.component').then(m => m.SupportRequestsAdminComponent),
      },
    ]
  },
  {
    path: PATHS.degreesTitles.path,
    canActivate: [AuthRoleGuard],
    data: {roles: [ROLE.degrees_titles]},
    loadComponent: () => import('./dashboard/staff/degrees-titles/degrees-titles-layout.component').then(m => m.DegreesTitlesLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: PATHS.degreesTitles.home.path,
        pathMatch: 'full',
      },
      {
        path: PATHS.degreesTitles.generalData.path,
        loadComponent: () => import('./dashboard/staff/degrees-titles/degree-general-data.component').then(m => m.DegreeGeneralDataComponent),
      },
      {
        path: PATHS.degreesTitles.calls.path,
        loadComponent: () => import('./dashboard/staff/degrees-titles/degree-calls.component').then(m => m.DegreeCallsComponent),
      },
      {
        path: PATHS.degreesTitles.records.path,
        loadComponent: () => import('./dashboard/staff/degrees-titles/degree-records.component').then(m => m.DegreeRecordsComponent),
      },
      {
        path: PATHS.degreesTitles.exports.path,
        loadComponent: () => import('./dashboard/staff/degrees-titles/degrees-titles-page.component').then(m => m.DegreesTitlesPageComponent),
        data: {title: 'Exportaciones SUNEDU'},
      },
    ],
  },
  {
    path: PATHS.hr.path,
    canActivate: [AuthRoleGuard],
    data: {roles: [ROLE.hr]},
    loadComponent: () => import('./dashboard/staff/hr-admin/hr-lay-out-component/hr-lay-out-component.component').then(m => m.HrLayOutComponentComponent),
    children: [
      {
        path: PATHS.hr.home.path,
        loadComponent: () => import('./dashboard/staff/staff-user/attendance-user/attendance-user.component').then(m => m.AttendanceUserComponent)
      },
      {
        path: PATHS.hr.staff.attendance.list.path,
        loadComponent: () => import('./dashboard/staff/hr-admin/attendace-admin/attendance.component').then(m => m.AttendanceListComponent)
      },
      {
        path: PATHS.hr.staff.attendance.register.path,
        loadComponent: () => import('./dashboard/staff/hr-admin/attendance-register/attendance-register.component').then(m => m.AttendanceRegisterComponent)
      },
      {
        path: PATHS.hr.staff.attendance.manual.path,
        loadComponent: () => import('./dashboard/staff/hr-admin/attendance-manual-list/attendance-manual-list.component').then(m => m.AttendanceManualListComponent)
      },
      {
        path: PATHS.hr.staff.attendance.reports.path,
        loadComponent: () => import('./dashboard/staff/hr-admin/hr-report-attendance-component/hr-report-attendance-component.component').then(m => m.HrReportAttendanceComponentComponent)
      },
    ]
  },
  {
    path: PATHS.staff.path,
    loadComponent: () => import('./dashboard/staff/staff-user/staff-user-lay-out-component/staff-user-lay-out-component.component').then(m => m.StaffUserLayOutComponentComponent),
    canActivate: [AuthRoleGuard],
    data: {roles: [ROLE.professor, ROLE.administrative]},
    children: [
      {
        path: PATHS.staff.home.path,
        loadComponent: () => import('./dashboard/staff/staff-user/attendance-user/attendance-user.component').then(m => m.AttendanceUserComponent)
      },
    ]
  },
  {
    // Todo lo de Bienestar Universitario vive bajo /dbu: las páginas públicas del alumno y el panel del personal.
    path: PATHS.dbu.path,
    children: [
      {path: PATHS.dbu.booking.path, loadComponent: () => import('./dbu-public/dbu-booking.component').then(m => m.DbuBookingComponent)},
      {path: PATHS.dbu.status.path, loadComponent: () => import('./dbu-public/dbu-status.component').then(m => m.DbuStatusComponent)},
      {
        path: '',
        loadComponent: () => import('./dashboard/staff/dbu/dbu-lay-out-component/dbu-lay-out.component').then(m => m.DbuLayOutComponent),
        canActivate: [AuthRoleGuard],
        data: {roles: [ROLE.dbu_admin, ROLE.dbu, ROLE.admin]},
        children: [
          {
            path: '',
            redirectTo: PATHS.dbu.home.path,
            pathMatch: 'full'
          },
          {
            path: PATHS.dbu.queue.path,
            loadComponent: () => import('./dashboard/staff/dbu/dbu-queue/dbu-queue.component').then(m => m.DbuQueueComponent),
          },
          {
            path: PATHS.dbu.config.path,
            loadComponent: () => import('./dashboard/staff/dbu/dbu-config/dbu-config.component').then(m => m.DbuConfigComponent),
            canActivate: [AuthRoleGuard],
            data: {roles: [ROLE.dbu_admin, ROLE.admin]},
          },
        ]
      },
    ]
  },
  {
    path: PATHS.accounting.path,
    loadComponent: () => import('./dashboard/staff/accounting/accounting-lay-out-component/accounting-lay-out-component.component').then(m => m.AccountingLayOutComponentComponent),
    canActivate: [AuthRoleGuard],
    data: {roles: [ROLE.accounting, ROLE.admin]},
    children: [
      {
        path: '',
        redirectTo: PATHS.accounting.home.path,
        pathMatch: 'full'
      },
      {
        path: PATHS.accounting.bank.incidents.path,
        loadComponent: () => import('./dashboard/staff/accounting/bn-incidents/bn-incidents.component').then(m => m.BnIncidentsComponent)
      },
      {
        path: PATHS.accounting.bank.traces.path,
        loadComponent: () => import('./dashboard/staff/accounting/bn-traces/bn-traces.component').then(m => m.BnTracesComponent)
      },
      {
        path: PATHS.accounting.bank.files.path,
        loadComponent: () => import('./dashboard/staff/accounting/bn-files/bn-files.component').then(m => m.BnFilesComponent)
      },
    ]
  },
  {
    path: PATHS.student.card.registration,
    loadComponent: () => import('./dashboard/student/student-card-registration/student-card-registration.component').then(m => m.StudentCardRegistrationComponent),
    canActivate: [AuthStudentGuard]
  },
  {
    path: PATHS.academic.path,
    loadComponent: () => import('./dashboard/staff/academic/academic-lay-out-component/academic-lay-out-component.component').then(m => m.AcademicLayOutComponentComponent),
    canActivate: [AuthRoleGuard],
    data: {roles: [ROLE.academic]},
    children: [
      {
        path: PATHS.academic.home.path,
        loadComponent: () => import('./dashboard/staff/staff-user/attendance-user/attendance-user.component').then(m => m.AttendanceUserComponent)
      },
      {
        path: PATHS.academic.semesters.path,
        loadComponent: () => import('./dashboard/staff/academic/semesters/semesters.component').then(m => m.SemestersComponent)
      },
      {
        path: PATHS.academic.cardSettings.path,
        loadComponent: () => import('./dashboard/staff/academic/student-card-settings/student-card-settings.component').then(m => m.StudentCardSettingsComponent)
      },
      {
        path: PATHS.academic.student.card.panel.path,
        loadComponent: () => import('./dashboard/staff/academic/student-cards/student-cards.component').then(m => m.StudentCardsComponent)
      },
      {
        path: PATHS.academic.student.ranking.path,
        loadComponent: () => import('./dashboard/staff/academic/student-ranking/student-ranking.component').then(m => m.StudentRankingComponent)
      },
      {
        path: PATHS.academic.student.approvedAverage.path,
        loadComponent: () => import('./dashboard/staff/academic/approved-average/approved-average.component').then(m => m.ApprovedAverageComponent)
      },
    ]
  },
  {
    path: '**', redirectTo: PATHS.login.staff
  }
];

