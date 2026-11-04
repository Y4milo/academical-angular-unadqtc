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
    path: PATHS.student.path,
    loadComponent: () => import('./dashboard/student/student-lay-out/student-lay-out.component').then(m => m.StudentLayOutComponent),
    canActivate: [AuthStudentGuard],
    children: [
      {
        path: PATHS.student.card.path,
        loadComponent: () => import('./dashboard/student/student-card-registration/student-card-registration.component').then(m => m.StudentCardRegistrationComponent),
      },
    ]
  },
  {
    // Páginas públicas del alumno (sin cuenta): reservar y consultar o cancelar una cita. El panel del personal vive en el marco único.
    path: PATHS.dbu.path,
    children: [
      {path: PATHS.dbu.booking.path, loadComponent: () => import('./dbu-public/dbu-booking.component').then(m => m.DbuBookingComponent)},
      {path: PATHS.dbu.status.path, loadComponent: () => import('./dbu-public/dbu-status.component').then(m => m.DbuStatusComponent)},
    ]
  },
  {
    // El marco único del personal: un solo menú (armado por el servidor con lo que la persona puede hacer) y un grupo de rutas por módulo, cada
    // uno con su guarda. Las direcciones son las de siempre; cambia que el marco no se vuelva a crear al pasar de un módulo a otro.
    path: '',
    loadComponent: () => import('./dashboard/staff-menu-base/staff-menu-base.component').then(m => m.StaffMenuBaseComponent),
    children: [
      {
        path: PATHS.admin.path,
        canActivate: [AuthRoleGuard],
        data: {roles: [ROLE.admin]},
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
          {path: PATHS.admin.academic.semesters.path, pathMatch: 'full', redirectTo: '/' + PATHS.academic.semesters.link},
          {path: PATHS.admin.academic.cardSettings.path, pathMatch: 'full', redirectTo: '/' + PATHS.academic.cardSettings.link},
          {
            path: PATHS.admin.academic.studentModules.path,
            loadComponent: () => import('./dashboard/staff/academic/student-modules/student-modules.component').then(m => m.StudentModulesComponent)
          },
          {path: PATHS.academic.student.card.panel.path, pathMatch: 'full', redirectTo: '/' + PATHS.academic.student.card.panel.link},
          {path: PATHS.academic.student.ranking.path, pathMatch: 'full', redirectTo: '/' + PATHS.academic.student.ranking.link},
          {path: PATHS.academic.student.approvedAverage.path, pathMatch: 'full', redirectTo: '/' + PATHS.academic.student.approvedAverage.link},
          {path: PATHS.admin.dbu.queue.path, pathMatch: 'full', redirectTo: '/' + PATHS.dbu.queue.link},
          {path: PATHS.admin.dbu.config.path, pathMatch: 'full', redirectTo: '/' + PATHS.dbu.config.link},
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
        data: {roles: [ROLE.degrees_titles], permissions: ['degrees_titles.manage'], banner: 'degrees-titles'},
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
        data: {roles: [ROLE.hr], permissions: ['attendance.manage']},
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
        canActivate: [AuthRoleGuard],
        data: {roles: [ROLE.professor, ROLE.administrative], permissions: ['attendance.view']},
        children: [
          {
            path: PATHS.staff.home.path,
            loadComponent: () => import('./dashboard/staff/staff-user/attendance-user/attendance-user.component').then(m => m.AttendanceUserComponent)
          },
        ]
      },
      {
        // Directivas con firma digital: las ve quien Core autoriza (el menú y el API lo deciden); cualquier rol del personal puede entrar.
        path: PATHS.directives.path,
        canActivate: [AuthRoleGuard],
        data: {roles: [ROLE.admin, ROLE.administrative, ROLE.professor, ROLE.accounting, ROLE.academic, ROLE.degrees_titles, ROLE.hr, ROLE.dbu_admin, ROLE.dbu]},
        children: [
          {
            path: '',
            loadComponent: () => import('./dashboard/staff/directives/directives-list/directives-list.component').then(m => m.DirectivesListComponent)
          },
          {
            path: 'nueva',
            loadComponent: () => import('./dashboard/staff/directives/directive-form/directive-form.component').then(m => m.DirectiveFormComponent)
          },
          {
            // Qué ve cada oficina de la ruta: solo el administrador del sistema (el API también lo exige).
            path: 'configuracion',
            canActivate: [AuthRoleGuard],
            data: {roles: [ROLE.admin], permissions: ['directives.settings']},
            loadComponent: () => import('./dashboard/staff/directives/directive-settings/directive-settings.component').then(m => m.DirectiveSettingsComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./dashboard/staff/directives/directive-detail/directive-detail.component').then(m => m.DirectiveDetailComponent)
          },
          {
            path: ':id/corregir',
            loadComponent: () => import('./dashboard/staff/directives/directive-resubmit/directive-resubmit.component').then(m => m.DirectiveResubmitComponent)
          },
          {
            path: ':id/editar',
            loadComponent: () => import('./dashboard/staff/directives/directive-form/directive-form.component').then(m => m.DirectiveFormComponent)
          },
          {
            path: ':id/firmar',
            loadComponent: () => import('./dashboard/staff/directives/directive-sign/directive-sign.component').then(m => m.DirectiveSignComponent)
          },
        ]
      },
      {
        path: PATHS.dbu.path,
        canActivate: [AuthRoleGuard],
        data: {roles: [ROLE.dbu_admin, ROLE.dbu, ROLE.admin], permissions: ['welfare.attend']},
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
            data: {roles: [ROLE.dbu_admin, ROLE.admin], permissions: ['welfare.administer']},
          },
        ]
      },
      {
        path: PATHS.accounting.path,
        canActivate: [AuthRoleGuard],
        data: {roles: [ROLE.accounting, ROLE.admin], permissions: ['accounting.bank']},
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
        path: PATHS.academic.path,
        canActivate: [AuthRoleGuard],
        data: {roles: [ROLE.academic, ROLE.admin], permissions: ['academic.semesters', 'student_card.manage']},
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
    ]
  },
  {
    path: '**', redirectTo: PATHS.login.staff
  }
];

