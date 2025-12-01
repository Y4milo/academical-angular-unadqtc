import {Component, OnInit} from '@angular/core';
import {Fingerprint, LucideAngularModule} from "lucide-angular";
import {Menubar} from "primeng/menubar";
import {MenuItem, PrimeTemplate} from "primeng/api";
import {RouterLink, RouterOutlet} from "@angular/router";
import {PATHS} from '../../../../core/constants/paths';

@Component({
  selector: 'app-staff-user-lay-out-component',
  imports: [
    LucideAngularModule,
    Menubar,
    PrimeTemplate,
    RouterOutlet,
    RouterLink
  ],
  templateUrl: './staff-user-lay-out-component.component.html',
  styleUrl: './staff-user-lay-out-component.component.css'
})
export class StaffUserLayOutComponentComponent implements OnInit{
  items: MenuItem[] | undefined;
  ngOnInit() {
    this.items = [
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
