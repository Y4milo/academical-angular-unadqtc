import {Pipe, PipeTransform} from '@angular/core';
import {lucideClass} from '../utils/lucide-icon.util';

/**
 * `'check' | lucideClass` gives the class that paints that Lucide icon, for the places where PrimeNG only takes an icon class
 * (`[icon]` of a tag or message, `chooseIcon` of a file upload...). In a button or a tag with room for a template, use <app-lucide-icon>.
 */
@Pipe({name: 'lucideClass', standalone: true})
export class LucideClassPipe implements PipeTransform {
  transform(name: string): string {
    return lucideClass(name);
  }
}
