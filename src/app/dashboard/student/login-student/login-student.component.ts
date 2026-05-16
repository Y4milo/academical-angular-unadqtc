import {Component} from '@angular/core';
import {LoginBaseComponent} from '../../login-base/login-base.component';
import {NotificationService} from '../../../services/notification.service';
import {Router} from '@angular/router';
import {NOTIFICATION_MESSAGE} from '../../../core/constants/app-messages.constants';
import {STATUS} from '../../../core/constants/api-status.constants';
import {LoginService} from '../../../services/login.service';
import {home_link, HomeKey} from '../../../core/constants/home-routes.constants';
import {PATHS} from '../../../core/constants/app-paths.constants';
import {StudentService} from '../../../services/student.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginBaseComponent], // Importa el componente LoginBaseComponent
  template: `
    <app-login-base
      [titleLabel]="'Iniciar Sesión'"
      [userLabel]="'DNI'"
      [userAlertMessage]="'El DNI es obligatorio'"
      [(user)]="user"
      [(password)]="password"
      (login)="login()"
    ></app-login-base>
  `,
})
export class LoginStudentComponent {
  user: string = '';
  password: string = '';

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private studentService: StudentService,
    private loginService: LoginService,
  ) {}

  login() {
    const loginData = new FormData();
    loginData.append('nick', this.user);
    loginData.append('password', this.password);

    // this.studentService.getCsrfCookie().subscribe(() => {
    //   this.studentService.logIn(loginData).subscribe(res => {
    //     console.log('Login correcto');
    //   });
    // });

    this.studentService.getCsrfCookie().subscribe(() => {
      this.studentService.logIn(loginData).subscribe({
        next: (loginStudentData) => {
          if (loginStudentData.status === STATUS.success) {
            const student_user = this.loginService.setStudent(loginStudentData);

            const key = student_user.role.value as HomeKey;
            let route = home_link[key];

            if (route === undefined) {
              route = PATHS.student.card.registration;
            }

            setTimeout(() => {
              this.router.navigate([route]);
            }, 2000);
          }
          this.notificationService.notifyApiData(loginStudentData);
        },
        error: (error) => {
          this.notificationService.error(
            NOTIFICATION_MESSAGE.error_connection.title,
            NOTIFICATION_MESSAGE.error_connection.message
          );
          console.error(error);
        }
      });
    });
  }

}
