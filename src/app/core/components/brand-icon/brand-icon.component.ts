import {Component, computed, input} from '@angular/core';
import {BRAND_ICON_PATHS, BrandIconName} from './brand-icon.paths';

/**
 * The logo of an operating system or a browser (the ones Lucide does not have), the same as Core's «Dispositivos y sesiones». It is decorative:
 * the name is always written next to it, so screen readers skip the drawing. It takes the color of the text.
 */
@Component({
  selector: 'app-brand-icon',
  template: `<svg class="brand-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" [attr.width]="size()" [attr.height]="size()"><path [attr.d]="path()" /></svg>`,
  styles: ':host { display: inline-flex; flex: none; } .brand-icon { display: block; }',
})
export class BrandIconComponent {
  readonly name = input.required<BrandIconName>();
  readonly size = input(14);
  protected readonly path = computed(() => BRAND_ICON_PATHS[this.name()]);
}
