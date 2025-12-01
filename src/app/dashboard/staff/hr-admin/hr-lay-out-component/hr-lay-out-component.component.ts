import {MenuItem, PrimeTemplate} from 'primeng/api';
import {Menubar} from 'primeng/menubar';
import {LucideAngularModule, FileIcon, Fingerprint, CalendarCheck} from 'lucide-angular';
import {RouterLink, RouterOutlet} from '@angular/router';
import {Component, OnInit} from '@angular/core';
import {PATHS} from '../../../../core/constants/paths';

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

  ngOnInit() {
    this.items = [
      {
        label: 'Asistencias',
        lucide: Fingerprint,
        routerLink: PATHS.hr.staff.attendance.list.path
      },
      {
        label: 'Reportes',
        lucide: CalendarCheck,
        routerLink: PATHS.hr.staff.attendance.reports.path
      },
      {
        label: 'Mi cuenta',
        lucide: Fingerprint,
        items: [
          {
            label: 'Cambiar contraseña',
            lucide: Fingerprint,
          },
          {
            label: 'Cerrar Sesión',
            lucide: Fingerprint,
          },
        ],
      },
    ]
  }
}
