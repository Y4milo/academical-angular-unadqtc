import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {catchError, throwError} from 'rxjs';
import {PATHS} from '../core/constants/app-paths.constants';
import {ROLE} from '../core/constants/app-roles.constants';
import {LoginService} from '../services/login.service';

const SESSION_EXPIRED_STATUSES = [401, 419];
const AUTH_ENDPOINTS = [
  '/users/v1/staff/login',
  '/users/v1/student/login',
];

export const sessionExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const loginService = inject(LoginService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRequest = AUTH_ENDPOINTS.some((endpoint) => req.url.includes(endpoint));

      if (SESSION_EXPIRED_STATUSES.includes(error.status) && !isAuthRequest) {
        const user = loginService.getUser();
        const loginPath = user?.role?.value === ROLE.student
          ? PATHS.login.student
          : PATHS.login.staff;

        loginService.removeUser();
        router.navigateByUrl(loginPath);
      }

      return throwError(() => error);
    }),
  );
};
