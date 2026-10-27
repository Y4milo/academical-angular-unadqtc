import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import {
  BREAKPOINTS, DBU_STATUS_VIEW, FORBIDDEN_TOKENS, SPACE_SCALE, STATE_SEVERITY, THEME_TOKENS, ThemeToken, TYPE_SCALE, TypographyToken, WEIGHT_SCALE,
} from '../../../../shared/ui/ui-tokens';

export interface TypographyRow {
  token: TypographyToken;
  value: string;
  ok: boolean;
}

export interface TokenRow {
  token: ThemeToken;
  light: string;
  dark: string;
  defined: boolean;
  ok: boolean;
}

/**
 * Catálogo de componentes de Academical: la fuente de verdad de la interfaz. Muestra los tokens de tema con su valor real en
 * claro y oscuro (y avisa si uno no existe o no cambia), las escalas, los componentes de PrimeNG con sus estados y los patrones de
 * las pantallas. Todo patrón nuevo o cambiado se agrega aquí en el mismo cambio (ver docs/frontend-components.md).
 */
@Component({
  selector: 'app-components-catalog',
  imports: [
    FormsModule, ButtonModule, CardModule, DatePickerModule, InputNumberModule, MessageModule, SelectButtonModule, SkeletonModule, TableModule, TabsModule, TagModule,
    ToggleSwitchModule,
  ],
  templateUrl: './components-catalog.component.html',
  styleUrl: './components-catalog.component.css',
})
export class ComponentsCatalogComponent implements OnInit {
  readonly tokenRows = signal<TokenRow[]>([]);
  readonly forbidden = FORBIDDEN_TOKENS;
  readonly space = SPACE_SCALE;
  readonly breakpoints = BREAKPOINTS;
  readonly typeRows = signal<TypographyRow[]>([]);
  readonly weightRows = signal<TypographyRow[]>([]);
  readonly severity = STATE_SEVERITY;
  readonly states = Object.entries(STATE_SEVERITY).map(([kind, severity]) => ({ kind, severity }));
  readonly dbuStatuses = Object.entries(DBU_STATUS_VIEW).map(([code, view]) => ({ code, label: view.label, severity: STATE_SEVERITY[view.kind] }));

  readonly weekdays = [{ label: 'Lun', value: 'mon' }, { label: 'Mar', value: 'tue' }, { label: 'Mié', value: 'wed' }];
  selectedDays = ['mon', 'tue'];
  switchOn = true;
  minutes = 60;
  sampleDate: Date | null = new Date(2026, 10, 2);
  sampleDateTime: Date | null = new Date(2026, 10, 13, 23, 59);
  attempts = 3;
  photoKb = 50;

  readonly sampleRows = [
    { name: 'Elena Vargas', types: 'Psicología', schedule: '08:00 a 15:00' },
    { name: 'Raúl Torres', types: 'Servicio social', schedule: '09:00 a 14:00' },
  ];

  ngOnInit(): void {
    this.tokenRows.set(this.measure());
    this.typeRows.set(this.measureTypography(TYPE_SCALE));
    this.weightRows.set(this.measureTypography(WEIGHT_SCALE));
  }

  /** Reads the declared value of each typography token from `styles.css`; a token that is missing or has another weight is flagged. */
  private measureTypography(scale: readonly TypographyToken[]): TypographyRow[] {
    const styles = getComputedStyle(document.documentElement);

    return scale.map(token => {
      const value = styles.getPropertyValue(token.token).trim();
      return { token, value, ok: value !== '' && (token.expected === undefined || value === token.expected) };
    });
  }

  /** Lee cada token en el tema claro y en el oscuro sin que se vea el cambio (todo ocurre antes de pintar) y deja el tema como estaba. */
  private measure(): TokenRow[] {
    const root = document.documentElement;
    const hadDark = root.classList.contains('app-dark');
    const read = (dark: boolean): string[] => {
      root.classList.toggle('app-dark', dark);
      const styles = getComputedStyle(root);
      return THEME_TOKENS.map(token => styles.getPropertyValue(token.name).trim());
    };

    const light = read(false);
    const dark = read(true);
    root.classList.toggle('app-dark', hadDark);

    return THEME_TOKENS.map((token, index) => {
      const defined = light[index] !== '' && dark[index] !== '';
      return { token, light: light[index], dark: dark[index], defined, ok: defined && (!token.followsTheme || light[index] !== dark[index]) };
    });
  }
}
