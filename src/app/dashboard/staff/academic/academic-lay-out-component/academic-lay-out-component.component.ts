import {Component, OnInit} from '@angular/core';
import {CalendarCheck, Fingerprint, House, LucideAngularModule} from 'lucide-angular';
import {Menubar} from 'primeng/menubar';
import {MenuItem} from 'primeng/api';
import {RouterOutlet} from '@angular/router';
import {UsersService} from '../../../../services/users.service';

@Component({
  standalone: true,
  selector: 'app-academic-lay-out-component',
  imports: [
    LucideAngularModule,
    Menubar,
    RouterOutlet,
  ],
  templateUrl: './academic-lay-out-component.component.html',
  styleUrl: './academic-lay-out-component.component.css'
})
export class AcademicLayOutComponentComponent implements OnInit {
  items: MenuItem[] | undefined;
  readonly icons = {
    fingerprint: Fingerprint,
    calendar: CalendarCheck,
  };

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

  getLucideIcon(iconKey: string) {
    return this.icons[iconKey as keyof typeof this.icons] || House;
  }
}
