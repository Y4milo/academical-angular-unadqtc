import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgIf} from '@angular/common';
import {DegreesTitlesService} from '../../../services/degrees-titles.service';
import {TestModeBannerComponent} from '../../../core/components/test-mode-banner.component';

@Component({
  selector: 'app-degrees-titles-page',
  imports: [NgIf, TestModeBannerComponent],
  template: `
    <app-test-mode-banner *ngIf="mailTestMode" area="Grados y Títulos" [recipient]="mailTestRecipient"></app-test-mode-banner>
    <section class="surface-card border-round shadow-2 p-4">
      <h1 class="mt-0">{{ title }}</h1>
      <p class="text-color-secondary mb-0">
        El módulo está habilitado. La interfaz funcional se incorporará en la siguiente entrega.
      </p>
    </section>
  `,
})
export class DegreesTitlesPageComponent implements OnInit {
  title = 'Grados y Títulos';
  mailTestMode = false;
  mailTestRecipient: string | null = null;

  constructor(private route: ActivatedRoute, private service: DegreesTitlesService) {}

  ngOnInit(): void {
    this.title = this.route.snapshot.data['title'] ?? this.title;
    this.service.getRecordCatalogs().subscribe({next: response => {
      this.mailTestMode = response.data.mail_delivery.test_mode;
      this.mailTestRecipient = response.data.mail_delivery.test_recipient;
    }});
  }
}
