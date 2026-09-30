import {Component, Input, ViewEncapsulation} from '@angular/core';
import {NgIf} from '@angular/common';

/**
 * Campo de formulario estándar: etiqueta (con marca de obligatorio y etiquetas de estado opcionales),
 * control proyectado, ayuda y error. Los estilos son globales (`.form-field*` en styles.css) para que
 * todos los formularios se vean igual. Uso:
 *
 *   <app-form-field label="Correo" for="email" [required]="true" [error]="errors.email" hint="Debe ser institucional">
 *     <app-status-tag fieldTag severity="info" value="Core"></app-status-tag>
 *     <input pInputText id="email" [(ngModel)]="email">
 *   </app-form-field>
 */
@Component({
  selector: 'app-form-field',
  imports: [NgIf],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="form-field">
      <div class="form-field__head">
        <label class="form-field__label" [attr.for]="for">{{ label }}<span *ngIf="required" class="form-field__required" aria-hidden="true">*</span></label>
        <ng-content select="[fieldTag]"></ng-content>
      </div>
      <ng-content></ng-content>
      <small *ngIf="error" class="form-field__error" role="alert">{{ error }}</small>
      <small *ngIf="hint && !error" class="form-field__hint">{{ hint }}</small>
    </div>
  `,
  styles: [`app-form-field { display: block; min-width: 0; }`],
})
export class FormFieldComponent {
  @Input({required: true}) label = '';
  /** id del control (para asociar la etiqueta). */
  @Input() for: string | null = null;
  @Input() required = false;
  @Input() hint = '';
  @Input() error = '';
}
