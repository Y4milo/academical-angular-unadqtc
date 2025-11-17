import {Component, OnInit} from '@angular/core';
import {Card} from 'primeng/card';
import {MenuItem, PrimeTemplate} from 'primeng/api';
import {Menubar} from 'primeng/menubar';
import {LucideAngularModule, FileIcon, Fingerprint, CalendarCheck} from 'lucide-angular';

// @ts-ignore
@Component({
  selector: 'app-hr-home',
  standalone: true,
  imports: [
    Card,
    Menubar,
    PrimeTemplate,
    LucideAngularModule
  ],
  templateUrl: './hr-home.component.html',
  styleUrl: './hr-home.component.css'
})
export class HrHomeComponent implements OnInit {
  items: MenuItem[] | undefined;
  readonly FileIcon = FileIcon;

  ngOnInit() {
    this.items = [
      {
        label: 'Asistencias',
        lucide: Fingerprint,
        link: 'staff/attendance'
      },
      {
        label: 'Reportes',
        lucide: CalendarCheck,
        link: '/staff/resports'
      },
    ]
  }
}
