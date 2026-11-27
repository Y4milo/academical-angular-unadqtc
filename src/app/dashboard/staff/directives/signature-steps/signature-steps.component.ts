import { Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { ProgressState } from '../../../../services/directives.service';

export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/** Una oficina de la ruta, ya lista para dibujar: el texto de sus etiquetas lo decide quien usa el componente. */
export interface SignatureStepView {
  key: string;
  person: string;
  office: string;
  state: ProgressState;
  role: { label: string; severity: TagSeverity } | null;
  status: { label: string; severity: TagSeverity };
  /** La persona que mira es quien tiene el turno en este paso: se añade la etiqueta «Tú». */
  mine?: boolean;
}

/** El ícono de cada estado: lo firmado, el turno, lo que espera y lo que se devolvió. */
const ICONS: Record<ProgressState, string> = { signed: 'check', active: 'pencil', waiting: 'clock', rejected: 'undo-2', skipped: 'minus' };

/**
 * El avance de las firmas de un documento: un nodo por oficina unido al siguiente por una línea (sólida y verde cuando ya firmó, de rayas cuando falta).
 * En pantallas anchas va en horizontal y en teléfono en vertical. Los colores siguen su significado, igual que en el resto del módulo.
 */
@Component({
  selector: 'app-signature-steps',
  imports: [AppLucideIconComponent, TagModule],
  templateUrl: './signature-steps.component.html',
  styleUrl: './signature-steps.component.css',
})
export class SignatureStepsComponent {
  readonly steps = input.required<SignatureStepView[]>();

  icon(state: ProgressState): string {
    return ICONS[state];
  }
}
