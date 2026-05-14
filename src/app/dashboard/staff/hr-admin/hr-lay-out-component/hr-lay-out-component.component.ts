import {Component, OnInit} from '@angular/core';
import {FileIcon, LucideAngularModule} from 'lucide-angular';
import {MenuItem, PrimeTemplate} from 'primeng/api';
import {Menubar} from 'primeng/menubar';
import {RouterLink, RouterOutlet} from '@angular/router';
import {UsersService} from '../../../../services/users.service';

@Component({
  selector: 'app-hr-lay-out-component',
  imports: [
    Menubar,
    PrimeTemplate,
    LucideAngularModule,
    RouterLink,
    RouterOutlet,
  ],
  templateUrl: './hr-lay-out-component.component.html',
  styleUrl: './hr-lay-out-component.component.css'
})
export class HrLayOutComponentComponent implements OnInit {
  items: MenuItem[] | undefined;
  readonly FileIcon = FileIcon;

  constructor(
    private usersService: UsersService
  ) {}

  ngOnInit() {
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
