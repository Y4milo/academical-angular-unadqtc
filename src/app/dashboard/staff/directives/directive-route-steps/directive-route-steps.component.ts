import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { PrimeTemplate } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { DirectiveRoute, RouteStep } from '../../../../services/directives.service';

const CONDITION_LABELS: Record<string, string> = { titular: 'Titular', encargado: 'Encargado', suplente: 'Suplente' };

/**
 * La ruta de firmas de una directiva: la oficina de origen, Calidad (si aplica), Asesoría Jurídica, Modernización y Presidencia, cada una con la
 * persona que Core tiene designada hoy. Si una oficina no tiene a nadie, lo dice y la directiva no se puede enviar.
 */
@Component({
  selector: 'app-directive-route-steps',
  imports: [DatePipe, PrimeTemplate, MessageModule, SkeletonModule, TagModule, TimelineModule],
  templateUrl: './directive-route-steps.component.html',
  styleUrl: './directive-route-steps.component.css',
})
export class DirectiveRouteStepsComponent {
  readonly route = input<DirectiveRoute | null>(null);
  readonly loading = input(false);
  readonly error = input('');

  readonly conditions = CONDITION_LABELS;
  readonly skeletonRows = [1, 2, 3, 4, 5];

  missing(step: RouteStep): boolean {
    return !step.skipped && step.holder === null;
  }
}
