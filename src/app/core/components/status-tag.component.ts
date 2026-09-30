import {Component, Input} from '@angular/core';
import {TagModule} from 'primeng/tag';

/**
 * Etiqueta de estado con tamaño único (12 px / 600) y sin partirse en dos líneas. Usar este componente
 * en lugar de `p-tag` suelto para que todas las etiquetas de la aplicación se vean iguales.
 * Colores con significado fijo: success = vigente, info = dato de Core, warn = por vencer / manual,
 * danger = vencido / error, secondary = sin dato.
 */
@Component({
  selector: 'app-status-tag',
  imports: [TagModule],
  template: `<p-tag [severity]="severity" [value]="value" [icon]="icon" styleClass="status-tag"></p-tag>`,
  styles: [`
    :host {
      display: inline-flex;
    }

    :host ::ng-deep .status-tag {
      font-size: var(--text-label);
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
      padding: var(--space-1) var(--space-2);
    }

    :host ::ng-deep .status-tag .p-tag-icon {
      font-size: var(--text-label);
    }
  `],
})
export class StatusTagComponent {
  @Input() value = '';
  @Input() severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined = 'secondary';
  @Input() icon: string | undefined;
}
