import {Component, OnInit} from '@angular/core';
import {CalendarCheck, Fingerprint, House, LucideAngularModule} from "lucide-angular";
import {Menubar} from "primeng/menubar";
import {MenuItem, PrimeTemplate} from "primeng/api";
import {RouterLink, RouterOutlet} from "@angular/router";
import {PATHS} from '../../../../core/constants/paths';

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
  ngOnInit() {
    this.items = [
      {
        label: 'Asistencias',
        icon: 'fingerprint',
        routerLink: PATHS.academic.home.path
      },
      {
        label: 'Alumnos',
        icon: 'fingerprint',
        items: [
          {
            label: 'Carnet Universitario',
            routerLink: PATHS.academic.student.card.panel.path
          },
          {
            label: 'Ranking Académico',
            routerLink: PATHS.academic.student.ranking.path
          },
        ]
      },
      {
        label: 'Mi cuenta',
        icon:'calendar',
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

  getLucideIcon(iconKey: string) {
    return this.icons[iconKey as keyof typeof this.icons] || House;  // Fallback a House si no coincide
  }
}
