import {Component, Input} from '@angular/core';
import {MessageModule} from 'primeng/message';
import {TooltipModule} from 'primeng/tooltip';

@Component({
  selector: 'app-test-mode-banner',
  standalone: true,
  imports: [MessageModule, TooltipModule],
  template: `<p-message severity="warn" icon="pi pi-flask" styleClass="test-mode-banner"
    [text]="message" [pTooltip]="recipient ? 'Buzón de prueba: ' + recipient : ''"></p-message>`,
  styles: [`
    :host{display:block;margin:.85rem 0}
    :host ::ng-deep .test-mode-banner{width:100%;padding:1rem 1.1rem;border:1px solid color-mix(in srgb,var(--p-orange-500) 45%,transparent);border-radius:12px;background:color-mix(in srgb,var(--p-orange-500) 11%,var(--p-content-background));color:var(--p-text-color);box-shadow:0 8px 22px color-mix(in srgb,var(--p-orange-500) 8%,transparent)}
    :host ::ng-deep .test-mode-banner .p-message-icon{color:var(--p-orange-500);font-size:1.15rem}
    :host ::ng-deep .test-mode-banner .p-message-text{font-size:.88rem;font-weight:650;line-height:1.45}
  `],
})
export class TestModeBannerComponent {
  @Input() area = 'Este módulo';
  @Input() recipient: string | null = null;
  @Input() publicView = false;

  get message(): string {
    return this.publicView
      ? `Modo de prueba activo. Puedes revisar ${this.area}, pero los correos no se enviarán a destinatarios reales.`
      : `Modo de prueba activo en ${this.area}. Todos los correos se redirigen al buzón de pruebas; ningún estudiante recibirá mensajes reales.`;
  }
}
