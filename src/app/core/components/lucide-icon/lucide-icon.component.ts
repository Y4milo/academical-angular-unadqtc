import {Component, Input} from '@angular/core';
import {LucideDynamicIcon} from '@lucide/angular';
import {getLucideIconData} from '../../utils/lucide-icon.util';

@Component({
  selector: 'app-lucide-icon',
  imports: [
    LucideDynamicIcon,
  ],
  template: `
    <svg
      [lucideIcon]="iconData"
      [size]="size"
      [attr.aria-hidden]="ariaHidden"
    ></svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      line-height: 1;
    }

    svg {
      display: block;
    }
  `],
})
export class AppLucideIconComponent {
  @Input() name?: string;
  @Input() size: number | string = 18;
  @Input() ariaHidden = true;

  get iconData() {
    return getLucideIconData(this.name);
  }
}
