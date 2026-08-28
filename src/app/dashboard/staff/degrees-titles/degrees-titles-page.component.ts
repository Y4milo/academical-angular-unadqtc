import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-degrees-titles-page',
  template: `
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

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.title = this.route.snapshot.data['title'] ?? this.title;
  }
}
