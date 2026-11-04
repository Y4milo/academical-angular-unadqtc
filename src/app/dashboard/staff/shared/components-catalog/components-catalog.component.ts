import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { FileUploadModule } from 'primeng/fileupload';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { PasswordModule } from 'primeng/password';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import {
  BREAKPOINTS, DBU_STATUS_VIEW, FORBIDDEN_TOKENS, SPACE_SCALE, STATE_SEVERITY, THEME_TOKENS, ThemeToken, TYPE_SCALE, TypographyToken, WEIGHT_SCALE,
} from '../../../../shared/ui/ui-tokens';
import { CatalogNotesComponent } from './catalog-notes.component';

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

/** Una fila de la guía «qué componente usar»: la necesidad, el componente de PrimeNG y lo que no debe usarse en su lugar. */
export interface ComponentGuide {
  need: string;
  component: string;
  avoid: string;
}

/** Secciones del catálogo, en el orden en que se muestran. Las que faltan (Datos, Navegación, Superposiciones, Avisos, Recetas, Auditoría) llegan en los siguientes cambios. */
export const CATALOG_SECTIONS = [
  { value: 'foundations', label: 'Fundamentos' },
  { value: 'actions', label: 'Acciones' },
  { value: 'forms', label: 'Formularios' },
  { value: 'patterns', label: 'Patrones' },
] as const;

export const ACTION_GUIDE: ComponentGuide[] = [
  { need: 'Acción principal de la pantalla o del diálogo (una sola)', component: 'p-button', avoid: '<button>, <a> con estilo de botón' },
  { need: 'Acción secundaria o que descarta', component: 'p-button severity="secondary" [outlined]="true"', avoid: '<button class="…">' },
  { need: 'Acción que borra o anula', component: 'p-button severity="danger" [outlined]="true", siempre con confirmación', avoid: 'Rojo escrito a mano' },
  { need: 'Acción solo con ícono (editar, descargar)', component: 'p-button [rounded]="true" [text]="true" con aria-label', avoid: '<button> con <i>' },
  { need: 'Acción con variantes (descargar en Word o PDF)', component: 'p-splitbutton', avoid: 'Dos botones pegados' },
  { need: 'Opción que se enciende y se apaga como botón', component: 'p-togglebutton', avoid: '<button> con clase active' },
  { need: 'Enlace que navega', component: 'routerLink en p-button [link]="true" o en el texto', avoid: '<a href> que recarga la página' },
];

export const FORM_GUIDE: ComponentGuide[] = [
  { need: 'Texto corto', component: 'input pInputText', avoid: '<input> sin la directiva' },
  { need: 'Texto largo', component: 'textarea pTextarea', avoid: '<textarea> sin la directiva' },
  { need: 'Una opción de una lista', component: 'p-select', avoid: '<select>, p-dropdown' },
  { need: 'Varias opciones de una lista', component: 'p-multiselect (muchas) o p-selectbutton con [multiple] (pocas)', avoid: '<select multiple>' },
  { need: 'Buscar y elegir entre muchos registros', component: 'p-autocomplete', avoid: 'Un select con cientos de opciones, p-chips' },
  { need: 'Fecha y fecha con hora', component: 'p-datepicker (modelo Date)', avoid: '<input type="date">, p-calendar' },
  { need: 'Número con límites', component: 'p-inputnumber con min, max y suffix', avoid: '<input type="number">' },
  { need: 'Sí o no que se guarda al instante', component: 'p-toggleswitch', avoid: '<input type="checkbox">, p-inputswitch' },
  { need: 'Casilla de aceptar o de elegir varias', component: 'p-checkbox', avoid: '<input type="checkbox">' },
  { need: 'Una opción entre pocas, a la vista', component: 'p-radiobutton o p-selectbutton', avoid: '<input type="radio">' },
  { need: 'Contraseña', component: 'p-password', avoid: '<input type="password">' },
  { need: 'Documento, cédula o teléfono con formato', component: 'p-inputmask', avoid: 'Validar a mano al escribir' },
  { need: 'Subir un archivo', component: 'p-fileupload (modo basic, customUpload, #filelabel vacío)', avoid: '<input type="file">' },
];

/**
 * Catálogo de componentes de Academical: la fuente de verdad de la interfaz. Muestra los tokens de tema con su valor real en
 * claro y oscuro (y avisa si uno no existe o no cambia), las escalas, los componentes de PrimeNG con su guía de uso y los patrones de
 * las pantallas. Todo patrón nuevo o cambiado se agrega aquí en el mismo cambio (ver docs/frontend-components.md).
 * Regla permanente: el catálogo mismo solo usa PrimeNG (nada de <ul>, <table> ni <button> nativos); `npm run check:primeng` lo vigila.
 */
@Component({
  selector: 'app-components-catalog',
  imports: [
    FormsModule, AutoCompleteModule, ButtonModule, CardModule, CheckboxModule, DatePickerModule, FileUploadModule, InputMaskModule, InputNumberModule, InputTextModule,
    MessageModule, MultiSelectModule, PasswordModule, RadioButtonModule, SelectModule, SelectButtonModule, SkeletonModule, SplitButtonModule, TableModule, TabsModule,
    TagModule, TextareaModule, ToggleButtonModule, ToggleSwitchModule, CatalogNotesComponent,
  ],
  templateUrl: './components-catalog.component.html',
  styleUrl: './components-catalog.component.css',
})
export class ComponentsCatalogComponent implements OnInit {
  readonly sections = CATALOG_SECTIONS;
  readonly actionGuide = ACTION_GUIDE;
  readonly formGuide = FORM_GUIDE;
  readonly tokenRows = signal<TokenRow[]>([]);
  readonly forbidden = FORBIDDEN_TOKENS.map(name => `<code>${name}</code>`);
  readonly space = SPACE_SCALE;
  readonly breakpointNotes = BREAKPOINTS.map(item => `${item.name}: hasta ${item.max} px`);
  readonly typeRows = signal<TypographyRow[]>([]);
  readonly weightRows = signal<TypographyRow[]>([]);
  readonly severity = STATE_SEVERITY;
  readonly states = Object.entries(STATE_SEVERITY).map(([kind, severity]) => ({ kind, severity }));
  readonly dbuStatuses = Object.entries(DBU_STATUS_VIEW).map(([code, view]) => ({ code, label: view.label, severity: STATE_SEVERITY[view.kind] }));

  readonly screenRules = [
    'Sin desplazamiento horizontal de la página a 375 px, 768 px y 1440 px.',
    'Una fila de formulario con <code>flex-wrap</code>; nunca <code>flex-direction: column</code> con un <code>flex-basis</code> en rem (se convierte en alto).',
    'Menú de secciones: lista vertical en escritorio y una fila que se desliza bajo 900 px.',
    'Tablas de texto: tarjetas etiqueta/valor bajo 640 px (<code>styleClass="dbu-stack"</code> como ejemplo).',
    'El esqueleto de carga no es más alto que lo que reemplaza en teléfono.',
  ];

  readonly sidebarNotes = [
    'Las opciones salen del API (<code>RoleMenus.php</code>, un bloque por módulo): nunca se agregan opciones a mano en el front.',
    'Íconos Lucide registrados en <code>lucide-icon.util.ts</code>; sin ícono, el menú muestra un círculo.',
    'Se carga una vez por sesión (<code>StaffMenuStore</code>) y se olvida al cerrar sesión.',
  ];

  readonly referenceScreens = [
    '<code>/admin/dbu/config</code>: menú de secciones, filas de ajuste, tablas apiladas y matriz de cupos.',
    '<code>/dbu/citas</code> y <code>/dbu/citas/estado</code>: páginas públicas del alumno, de un solo paso por pantalla, para teléfono.',
    '<code>/admin/accounting/bank/*</code>: listas propias con detalle en <code>p-drawer</code>.',
    '<code>/admin/academic/semesters</code> y <code>/admin/academic/student-card</code>: fechas con <code>p-datepicker</code>, números con <code>p-inputnumber</code>, interruptores y pagos exportables.',
    '<code>/student/card/registration</code>: flujo del carné del estudiante.',
  ];

  readonly weekdays = [{ label: 'Lun', value: 'mon' }, { label: 'Mar', value: 'tue' }, { label: 'Mié', value: 'wed' }];
  readonly offices = [{ name: 'Psicología', code: 'psy' }, { name: 'Servicio social', code: 'soc' }, { name: 'Enfermería', code: 'nur' }];
  selectedDays = ['mon', 'tue'];
  switchOn = true;
  minutes = 60;
  sampleDate: Date | null = new Date(2026, 10, 2);
  sampleDateTime: Date | null = new Date(2026, 10, 13, 23, 59);
  attempts = 3;
  photoKb = 50;
  textValue = 'Elena Vargas';
  noteValue = '';
  office: { name: string; code: string } | null = null;
  officeList: { name: string; code: string }[] = [];
  searchText: { name: string; code: string } | null = null;
  officeSuggestions: { name: string; code: string }[] = [];
  accepted = true;
  channel = 'mail';
  documentNumber = '';
  secret = '';
  pinned = false;

  readonly splitItems = [{ label: 'Descargar en Word' }, { label: 'Descargar en PDF' }];

  readonly sampleRows = [
    { name: 'Elena Vargas', types: 'Psicología', schedule: '08:00 a 15:00' },
    { name: 'Raúl Torres', types: 'Servicio social', schedule: '09:00 a 14:00' },
  ];

  ngOnInit(): void {
    this.tokenRows.set(this.measure());
    this.typeRows.set(this.measureTypography(TYPE_SCALE));
    this.weightRows.set(this.measureTypography(WEIGHT_SCALE));
  }

  searchOffices(event: { query: string }): void {
    const query = event.query.toLowerCase();
    this.officeSuggestions = this.offices.filter(item => item.name.toLowerCase().includes(query));
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
