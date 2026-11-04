import {Component, OnInit, signal} from '@angular/core';
import {TestModeBannerComponent} from '../../../core/components/test-mode-banner.component';
import {DegreesTitlesService} from '../../../services/degrees-titles.service';
import {SupportRequestService} from '../../../services/support-request.service';

/**
 * El aviso de modo de prueba de grados y títulos: se muestra encima de sus pantallas cuando los correos del módulo van al buzón de pruebas.
 * Antes vivía en un marco propio de este módulo; ahora el marco único lo muestra solo en las rutas que lo piden (`data.banner`).
 */
@Component({
  selector: 'app-degrees-titles-banner',
  imports: [TestModeBannerComponent],
  template: `@if (testMode()) {<app-test-mode-banner area="Grados y Títulos" [recipient]="testRecipient()"></app-test-mode-banner>}`,
  styles: [':host { display: block; }'],
})
export class DegreesTitlesBannerComponent implements OnInit {
  readonly testMode = signal(false);
  readonly testRecipient = signal<string | null>(null);

  constructor(private service: DegreesTitlesService, private supportService: SupportRequestService) {}

  ngOnInit(): void {
    this.supportService.configuration().subscribe({next: response => this.testMode.set(response.payload.data.test_mode)});
    this.service.getRecordCatalogs().subscribe({next: response => {
      this.testMode.set(response.data.mail_delivery.test_mode);
      this.testRecipient.set(response.data.mail_delivery.test_recipient);
    }});
  }
}
