import { Component, input, model } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';

/**
 * El botón pequeño y en negrita de las pantallas de directivas (con el número de movimientos) y el cajón que entra por la derecha con lo que
 * se le proyecte dentro. Lo usan el seguimiento de una directiva y el registro de cambios de «Visibilidad de documentos».
 */
@Component({
  selector: 'app-directive-log-drawer',
  imports: [DrawerModule],
  templateUrl: './directive-log-drawer.component.html',
  styleUrl: './directive-log-drawer.component.css',
})
export class DirectiveLogDrawerComponent {
  readonly label = input('Seguimiento');
  /** Ícono de PrimeIcons del botón; cada tipo de cajón tiene el suyo. */
  readonly icon = input('pi-history');
  readonly count = input(0);
  /** Abierto o cerrado; la pantalla puede abrirlo y leer su estado. */
  readonly open = model(false);
  readonly testId = input('tracking');
}
