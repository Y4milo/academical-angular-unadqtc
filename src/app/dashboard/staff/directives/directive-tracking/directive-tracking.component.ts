import { DatePipe } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { PrimeTemplate } from 'primeng/api';
import { TimelineModule } from 'primeng/timeline';
import { DirectiveEvent } from '../../../../services/directives.service';
import { DirectiveLogDrawerComponent } from './directive-log-drawer.component';
import { eventAuthor, eventChanges, eventDetail, eventLabel } from './directive-events';

/**
 * El seguimiento de una directiva: un botón pequeño y en negrita con el número de movimientos y, al pulsarlo, un cajón que entra por la derecha con la
 * línea de tiempo (quién, en qué oficina, cuándo y el antes y el después de cada cambio). Es el mismo botón en todas las pantallas de directivas.
 */
@Component({
  selector: 'app-directive-tracking',
  imports: [DatePipe, DirectiveLogDrawerComponent, PrimeTemplate, TimelineModule],
  templateUrl: './directive-tracking.component.html',
  styleUrl: './directive-tracking.component.css',
})
export class DirectiveTrackingComponent {
  readonly events = input<DirectiveEvent[]>([]);
  /** Lo que dice el cajón cuando todavía no hay movimientos (una directiva que aún no se guardó). */
  readonly emptyText = input('Todavía no hay movimientos.');
  /** Abierto o cerrado; la pantalla puede abrirlo y leer su estado. */
  readonly open = model(false);

  readonly label = eventLabel;
  readonly author = eventAuthor;
  readonly detail = eventDetail;
  readonly changes = eventChanges;
}
