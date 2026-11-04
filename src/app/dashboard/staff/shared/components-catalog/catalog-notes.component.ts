import { Component, input } from '@angular/core';
import { DataViewModule } from 'primeng/dataview';

/**
 * Lista de notas del catálogo. Es un `p-dataview` (nunca un `<ul>`): cada nota es un texto corto con `<code>` permitido
 * (Angular lo sanea), siempre escrito en el propio catálogo y nunca recibido del usuario.
 */
@Component({
  selector: 'app-catalog-notes',
  imports: [DataViewModule],
  template: `
    <p-dataview [value]="items()" styleClass="catalog-notes">
      <ng-template #list let-rows>
        @for (note of rows; track note) {
          <div class="catalog-notes__item" [innerHTML]="note"></div>
        }
      </ng-template>
    </p-dataview>
  `,
  styles: `
    :host { display: block; }
    :host ::ng-deep .catalog-notes .p-dataview-content { background: transparent; border: none; padding: 0; }
    .catalog-notes__item { padding: .35rem 0; border-bottom: 1px solid var(--p-content-border-color); font-size: var(--text-body); }
    .catalog-notes__item:last-child { border-bottom: none; }
    :host ::ng-deep code { font-size: var(--text-small); }
  `,
})
export class CatalogNotesComponent {
  readonly items = input.required<string[]>();
}
