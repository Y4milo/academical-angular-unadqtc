import {Card} from 'primeng/card';
import {MenuItem, PrimeTemplate} from 'primeng/api';
import {Menubar} from 'primeng/menubar';
import {LucideAngularModule, FileIcon, Fingerprint, CalendarCheck} from 'lucide-angular';
import {RouterLink, RouterOutlet} from '@angular/router';
import {Component, OnInit} from '@angular/core';
import {paths} from '../../../../core/constants/paths';

@Component({
  selector: 'app-hr-lay-out-component',
  imports: [
    Card,
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

  ngOnInit() {
    this.items = [
      {
        label: 'Asistencias',
        lucide: Fingerprint,
        routerLink: paths.hr.staff.attendance.list.route
      },
      {
        label: 'Reportes',
        lucide: CalendarCheck,
        routerLink: paths.hr.staff.attendance.reports.route
      },
    ]
  }
}
