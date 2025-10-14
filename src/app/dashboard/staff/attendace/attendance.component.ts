import {Component, OnInit} from '@angular/core';
import {Card} from "primeng/card";
import {DropdownModule} from "primeng/dropdown";
import {ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "primeng/api";
import {DatePipe} from '@angular/common';
import {LoginUser} from '../../../models/login-user.model';

@Component({
  selector: 'app-attendace',
  imports: [
    Card,
    DropdownModule,
    ReactiveFormsModule,
    SharedModule,
    DatePipe
  ],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceComponent implements OnInit {
    user!: string;
    today!: Date;
    loginUser!: LoginUser;

    constructor() { }

  ngOnInit(): void {
      this.loginUser = JSON.parse(sessionStorage.getItem('login_id')!) as LoginUser;
      this.today = new Date();
      this.user = this.loginUser.person_id.names;

  }
}
