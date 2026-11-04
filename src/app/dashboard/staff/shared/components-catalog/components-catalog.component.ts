import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MenuItem, MessageService, TreeNode } from 'primeng/api';
import { AccordionModule } from 'primeng/accordion';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DataViewModule } from 'primeng/dataview';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DrawerModule } from 'primeng/drawer';
import { FileUploadModule } from 'primeng/fileupload';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { PanelMenuModule } from 'primeng/panelmenu';
import { PasswordModule } from 'primeng/password';
import { PopoverModule } from 'primeng/popover';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { SplitButtonModule } from 'primeng/splitbutton';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { TreeModule } from 'primeng/tree';
import {
  BREAKPOINTS, DBU_STATUS_VIEW, FORBIDDEN_TOKENS, SPACE_SCALE, STATE_SEVERITY, THEME_TOKENS, ThemeToken, TYPE_SCALE, TypographyToken, WEIGHT_SCALE,
} from '../../../../shared/ui/ui-tokens';
import { DATA_GUIDE, FEEDBACK_GUIDE, NAV_GUIDE, OVERLAY_GUIDE } from './catalog-guides';
import { CatalogNotesComponent } from './catalog-notes.component';
import { SCREEN_RECIPES } from './catalog-recipes';
import baseline from './primeng-baseline.json';

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

/** Una fila de la auditoría: cuántos usos de una regla quedan en el front antiguo y en cuántos archivos. */
export interface AuditRule {
  rule: string;
  uses: number;
  files: number;
}

/** Cuenta, por regla, los usos que el verificador tolera hoy (el tope de `primeng-baseline.json`); solo baja cuando se migra un archivo. */
export function auditRules(source: Record<string, Record<string, number>>): AuditRule[] {
  const totals = new Map<string, AuditRule>();

  for (const rules of Object.values(source)) {
    for (const [rule, count] of Object.entries(rules)) {
      const row = totals.get(rule) ?? { rule, uses: 0, files: 0 };
      row.uses += count;
      row.files += 1;
      totals.set(rule, row);
    }
  }

  return [...totals.values()].sort((a, b) => b.uses - a.uses);
}

/** Secciones del catálogo, en el orden en que se muestran. Recetas son las 12 pantallas tipo y Auditoría lo obsoleto que queda en el front. */
export const CATALOG_SECTIONS = [
  { value: 'foundations', label: 'Fundamentos' },
  { value: 'actions', label: 'Acciones' },
  { value: 'forms', label: 'Formularios' },
  { value: 'data', label: 'Datos' },
  { value: 'navigation', label: 'Navegación' },
  { value: 'overlays', label: 'Superposiciones' },
  { value: 'feedback', label: 'Avisos' },
  { value: 'recipes', label: 'Recetas' },
  { value: 'patterns', label: 'Patrones' },
  { value: 'audit', label: 'Auditoría' },
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
    FormsModule, AccordionModule, AvatarModule, BadgeModule, BreadcrumbModule, ChipModule, ConfirmDialogModule, ConfirmPopupModule, DataViewModule, DialogModule, DividerModule,
    DrawerModule, MenuModule, PaginatorModule, PanelMenuModule, PopoverModule, ProgressBarModule, ProgressSpinnerModule, StepsModule, TimelineModule, ToastModule, TooltipModule,
    TreeModule, AutoCompleteModule, ButtonModule, CardModule, CheckboxModule, DatePickerModule, FileUploadModule, InputMaskModule, InputNumberModule, InputTextModule,
    MessageModule, MultiSelectModule, PasswordModule, RadioButtonModule, SelectModule, SelectButtonModule, SkeletonModule, SplitButtonModule, TableModule, TabsModule,
    TagModule, TextareaModule, ToggleButtonModule, ToggleSwitchModule, CatalogNotesComponent,
  ],
  templateUrl: './components-catalog.component.html',
  styleUrl: './components-catalog.component.css',
  providers: [ConfirmationService],
})
export class ComponentsCatalogComponent implements OnInit {
  readonly sections = CATALOG_SECTIONS;
  readonly actionGuide = ACTION_GUIDE;
  readonly formGuide = FORM_GUIDE;
  readonly dataGuide = DATA_GUIDE;
  readonly navGuide = NAV_GUIDE;
  readonly overlayGuide = OVERLAY_GUIDE;
  readonly feedbackGuide = FEEDBACK_GUIDE;
  readonly recipes = SCREEN_RECIPES;
  readonly auditByRule = auditRules(baseline);
  readonly auditFiles = Object.entries(baseline as Record<string, Record<string, number>>)
    .map(([file, rules]) => ({ file, uses: Object.values(rules).reduce((sum, count) => sum + count, 0), detail: Object.entries(rules).map(([rule, count]) => `${rule}: ${count}`).join(' · ') }))
    .sort((a, b) => b.uses - a.uses);
  readonly auditHowTo = [
    'Migrar un archivo: cambiar el control por su componente de PrimeNG (ver la guía de cada sección) y correr <code>npm run check:primeng -- --fix-baseline</code>.',
    'Los módulos obsoletos se reemplazan así: <code>calendar</code> por <code>p-datepicker</code>, <code>dropdown</code> por <code>p-select</code>, <code>tabview</code> por <code>p-tabs</code>, <code>overlaypanel</code> por <code>p-popover</code>.',
    'Un uso justificado se exime con una línea <code>primeng-ok: motivo</code>; nunca para esquivar la regla.',
  ];
  readonly auditTotal = this.auditByRule.reduce((sum, row) => sum + row.uses, 0);
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
    '<code>/academic/semesters</code> y <code>/academic/student-card</code>: fechas con <code>p-datepicker</code>, números con <code>p-inputnumber</code>, interruptores y pagos exportables.',
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

  readonly timelineEvents = [
    { status: 'Directiva creada', date: '02/11/2026 09:10', severity: 'info' },
    { status: 'Enviada a firma', date: '02/11/2026 09:40', severity: 'warn' },
    { status: 'Firmada', date: '03/11/2026 11:05', severity: 'success' },
  ];
  readonly treeNodes: TreeNode[] = [
    { label: 'Rectorado', expanded: true, children: [{ label: 'Secretaría general' }, { label: 'Bienestar universitario', children: [{ label: 'Psicología' }, { label: 'Servicio social' }] }] },
  ];
  readonly breadcrumbItems: MenuItem[] = [{ label: 'Bienestar' }, { label: 'Citas' }, { label: 'Configuración' }];
  readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home' };
  readonly stepItems: MenuItem[] = [{ label: 'Datos' }, { label: 'Documento' }, { label: 'Foto' }];
  readonly rowMenu: MenuItem[] = [{ label: 'Ver detalle', icon: 'pi pi-eye' }, { label: 'Descargar', icon: 'pi pi-download' }];
  readonly panelItems: MenuItem[] = [
    { label: 'Bienestar', items: [{ label: 'Cola de citas' }, { label: 'Configuración de citas' }] },
    { label: 'Directivas', items: [{ label: 'Directivas' }] },
  ];
  readonly pagedRows = Array.from({ length: 12 }, (_, index) => ({ code: `D-${100 + index}`, title: `Directiva de ejemplo ${index + 1}`, state: index % 3 === 0 ? 'Firmada' : 'En firma' }));
  progress = 65;
  dialogOpen = false;
  drawerOpen = false;

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

  constructor(private readonly confirmation: ConfirmationService, private readonly messages: MessageService) {}

  confirmPopup(event: Event): void {
    this.confirmation.confirm({ target: event.target as EventTarget, message: '¿Anular esta directiva?', acceptLabel: 'Anular', rejectLabel: 'Volver', key: 'popup' });
  }

  confirmDialog(): void {
    this.confirmation.confirm({ header: 'Anular directiva', message: 'La directiva dejará de circular y no se podrá reactivar.', acceptLabel: 'Anular', rejectLabel: 'Volver', key: 'dialog' });
  }

  showToast(): void {
    this.messages.add({ key: 'catalog', severity: 'success', summary: 'Guardado', detail: 'Los cambios quedaron registrados.' });
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
