import { Component } from '@angular/core';
import {LoginBaseComponent} from '../../login-base/login-base.component';
import {NotificationService} from '../../../services/notification.service';
import {Router} from '@angular/router';
import {environment} from '../../../../environments/environment';
import {DictionaryService} from '../../../services/dictionary.service';
import jwtEncode from 'jwt-encode';
import {UserLogin} from '../../../models/user-login.model';
import {jwtDecode} from 'jwt-decode';

@Component({
  imports: [LoginBaseComponent],
  template: `
    <app-login-base
      [titleLabel]="'Iniciar Sesión'"
      [userLabel]="'Personal Universitario'"
      [userAlertMessage]="'El usuario es obligatorio'"
      [(user)]="user"
      [(password)]="password"
      (login)="login()"
    ></app-login-base>
  `,
})
export class LoginAdminComponent {
  user: string = '';
  password: string = '';

  constructor(
    private notification: NotificationService,
    private router: Router,
    private dictionaryService: DictionaryService
  ) {}

  login() {
    const payload = {
      user: this.user,
      password: this.password
    };

    const loginData = new FormData();
    loginData.append('payload', JSON.stringify(payload));

    this.dictionaryService.logInAdmin(loginData).subscribe({
      next: (loginAdminRes) => {
        if (loginAdminRes.status === 'success') {
          sessionStorage.setItem('login_id', loginAdminRes.payload.data);
          const user: UserLogin = jwtDecode(loginAdminRes.payload.data);
          let route = "/admin";
          switch (user.user_type_value){
            case "accounting":
              route += "/accounting-payments";
              break;
            case "academic":
              route += "/student-cards";
          }
          setTimeout(() => {
            this.router.navigate([route]);
          }, 2000);
        }
        this.notification.notifyApiData(loginAdminRes);
      },
      error: (e) => {
        this.notification.error('Error de conexión', 'El servicio no esta disponible en este momento');
        console.error(e);
      }
    })
  }
}
