import {Component, Input} from '@angular/core';
import {CardModule} from 'primeng/card';
import {SkeletonModule} from 'primeng/skeleton';

/**
 * Esqueleto de carga de las tarjetas de asistencia por día: tiene la misma forma que las tarjetas reales (fecha, sede y una línea de
 * tiempo con dos marcaciones), así no hay saltos cuando llegan los datos. Lo usan «Asistencias del personal» y «Mis asistencias».
 */
@Component({
  selector: 'app-staff-attendance-skeleton',
  imports: [CardModule, SkeletonModule],
  templateUrl: './staff-attendance-skeleton.component.html',
  styleUrl: './staff-attendance-skeleton.component.css',
})
export class StaffAttendanceSkeletonComponent {
  /** Cuántas tarjetas de ejemplo se muestran. */
  @Input() set days(value: number) {
    this.items = Array.from({length: Math.max(1, value)}, (_, index) => index);
  }

  items = [0, 1];
}
