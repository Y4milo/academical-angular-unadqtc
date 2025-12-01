import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import {PrimeNG} from 'primeng/config';
import {SPANISH_DATE_PICKER} from './core/spanish_date_picker';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'academical';
  constructor(private primeng: PrimeNG) {
    this.primeng.setTranslation(SPANISH_DATE_PICKER);
  }
}
