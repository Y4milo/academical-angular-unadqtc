import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgIf} from '@angular/common';
import {ButtonModule} from 'primeng/button';

/**
 * Encabezado de página o de sección: enlace opcional de retorno, título, subtítulo y 24 px de separación
 * hasta el contenido. El enlace de retorno compensa el relleno del botón para alinear su texto con el título.
 */
@Component({
  selector: 'app-page-header',
  imports: [ButtonModule, NgIf],
  template: `
    <header class="page-header" [class.page-header--section]="size === 'section'">
      <p-button *ngIf="backLabel" [label]="backLabel" icon="pi pi-arrow-left" [text]="true" size="small"
                styleClass="page-header-back" (onClick)="back.emit()"></p-button>
      <h1 *ngIf="size === 'page'">{{ title }}</h1>
      <h2 *ngIf="size === 'section'">{{ title }}</h2>
      <p *ngIf="subtitle">{{ subtitle }}</p>
    </header>
  `,
  styles: [`
    :host {
      display: block;
    }

    .page-header {
      display: grid;
      gap: var(--space-1);
      margin-bottom: var(--space-5);
    }

    h1, h2 {
      margin: 0;
      line-height: var(--leading-tight);
    }

    h1 {
      font-size: var(--text-title);
      font-weight: 700;
    }

    h2 {
      font-size: 1.375rem;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: var(--p-text-muted-color);
      font-size: var(--text-body);
      line-height: var(--leading-body);
    }

    :host ::ng-deep .page-header-back {
      justify-self: start;
      margin-left: calc(var(--space-3) * -1);
      margin-bottom: var(--space-1);
    }
  `],
})
export class PageHeaderComponent {
  @Input({required: true}) title = '';
  @Input() subtitle = '';
  @Input() backLabel = '';
  @Input() size: 'page' | 'section' = 'page';
  @Output() back = new EventEmitter<void>();
}
