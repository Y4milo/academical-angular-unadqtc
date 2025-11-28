import {Component, OnInit} from '@angular/core';
import {Card} from "primeng/card";
import {CalendarCheck, Fingerprint, LucideAngularModule, FileIcon} from "lucide-angular";
import {Menubar} from "primeng/menubar";
import {MenuItem, PrimeTemplate} from "primeng/api";
import {RouterLink, RouterOutlet} from "@angular/router";
import {paths} from '../../../../core/constants/paths';

@Component({
  selector: 'app-academic-lay-out-component',
  imports: [
    LucideAngularModule,
    Menubar,
    PrimeTemplate,
    RouterOutlet,
    RouterLink
  ],
  templateUrl: './academic-lay-out-component.component.html',
  styleUrl: './academic-lay-out-component.component.css'
})
export class AcademicLayOutComponentComponent implements OnInit {
  items: MenuItem[] | undefined;
  readonly FileIcon = FileIcon;

  ngOnInit() {
    this.items = [
      {
        label: 'Asistencias',
        lucide: Fingerprint,
        routerLink: paths.academic.home.route
      },
      {
        label: 'Carnet Universitario',
        lucide: CalendarCheck,
        routerLink: paths.academic.student.card.panel.route
      },
      {
        label: 'Ranking Académico',
        lucide: CalendarCheck,
        routerLink: paths.academic.student.ranking.route
      },
    ]
  }
}
