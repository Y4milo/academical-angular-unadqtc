import {Component, OnInit} from '@angular/core';
import {Menubar} from "primeng/menubar";
import {RouterOutlet} from "@angular/router";
import {MenuItem} from 'primeng/api';
import {StaffUser} from '../../models/staff-user.model';
import {LoginService} from '../../services/login.service';
import {UsersService} from '../../services/users.service';

@Component({
  selector: 'app-staff-menu-base',
    imports: [
        Menubar,
        RouterOutlet
    ],
  templateUrl: './staff-menu-base.component.html',
  styleUrl: './staff-menu-base.component.css'
})
export class StaffMenuBaseComponent implements OnInit{
    items!: MenuItem[];
    staffUser!: StaffUser;

    constructor(
      private loginService: LoginService,
      private usersService: UsersService
    ) { }

    ngOnInit(): void {
      this.staffUser = this.loginService.getUser();
      this.items = [];

      this.usersService.getStaffMenu().subscribe({
        next: (response) => {
          this.items = response.payload.data ?? [];
        },
        error: () => {
          this.items = [];
        }
      });
    }
}
