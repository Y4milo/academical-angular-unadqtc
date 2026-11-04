import { ComponentGuide } from './components-catalog.component';

export const DATA_GUIDE: ComponentGuide[] = [
  { need: 'Lista de registros con columnas', component: 'p-table (con [paginator], pSortableColumn y styleClass="dbu-stack" para teléfono)', avoid: '<table>, <ul> con filas' },
  { need: 'Lista de tarjetas o de filas libres', component: 'p-dataview', avoid: '<ul>, <ol>, @for de <div> sin contenedor' },
  { need: 'Historial o secuencia de eventos', component: 'p-timeline', avoid: '<ul> con viñetas, <ol>' },
  { need: 'Jerarquía (unidades, módulos)', component: 'p-tree', avoid: '<ul> anidados' },
  { need: 'Estado de un registro', component: 'p-tag con STATE_SEVERITY (o app-status-tag); su padding .375rem .75rem lo da el preset', avoid: 'Un <span> con color a mano, o un padding propio por pantalla' },
  { need: 'Contador sobre un ícono o un título', component: 'p-badge', avoid: '<span> redondo con número' },
  { need: 'Valor que se puede quitar o filtro aplicado', component: 'p-chip', avoid: '<span> con ×' },
  { need: 'Foto o iniciales de una persona', component: 'p-avatar', avoid: '<img> redondo suelto' },
  { need: 'Agrupar contenido con título', component: 'p-card o p-panel; p-fieldset si es de formulario', avoid: '<div> con borde propio' },
  { need: 'Separar bloques', component: 'p-divider', avoid: '<hr>' },
];

export const NAV_GUIDE: ComponentGuide[] = [
  { need: 'Secciones de una misma pantalla', component: 'p-tabs (scrollable en teléfono)', avoid: 'p-tabView, botones que cambian un @if' },
  { need: 'Menú lateral del módulo', component: 'p-panelmenu en StaffMenuBaseComponent', avoid: 'Opciones agregadas a mano en el front' },
  { need: 'Dónde estoy', component: 'p-breadcrumb', avoid: 'Texto con «>» escrito a mano' },
  { need: 'Flujo por pasos (solo lectura)', component: 'p-steps con «Atrás» y «Siguiente»', avoid: 'Números en <div>' },
  { need: 'Acciones de una fila o de un botón', component: 'p-menu (popup) o p-tieredmenu', avoid: '<ul> desplegable propio' },
  { need: 'Páginas de una lista larga', component: 'p-paginator o [paginator] de p-table', avoid: 'Botones «anterior» y «siguiente» propios' },
  { need: 'Secciones plegables', component: 'p-accordion', avoid: '<details>' },
];

export const OVERLAY_GUIDE: ComponentGuide[] = [
  { need: 'Formulario o detalle corto que bloquea la pantalla', component: 'p-dialog [modal]="true" con appendTo="body"', avoid: '<dialog>, div fijo con fondo' },
  { need: 'Detalle largo junto a una lista', component: 'p-drawer (lado derecho)', avoid: 'p-sidebar, panel propio' },
  { need: 'Confirmar una acción que borra o anula', component: 'p-confirmdialog (ConfirmationService)', avoid: 'confirm() del navegador' },
  { need: 'Confirmar junto al botón', component: 'p-confirmpopup', avoid: 'confirm() del navegador' },
  { need: 'Ayuda breve o filtros pequeños', component: 'p-popover', avoid: 'p-overlayPanel' },
  { need: 'Explicar un ícono o un botón de solo ícono', component: 'pTooltip', avoid: 'Atributo title' },
];

export const FEEDBACK_GUIDE: ComponentGuide[] = [
  { need: 'Aviso dentro de la pantalla', component: 'p-message (info, warn, error, success)', avoid: '<div class="alert">' },
  { need: 'Resultado de una acción', component: 'p-toast con MessageService', avoid: 'alert() del navegador' },
  { need: 'Avance de una tarea con porcentaje', component: 'p-progressbar', avoid: '<progress>' },
  { need: 'Espera sin porcentaje', component: 'p-progressspinner o [loading] del botón', avoid: 'Ruedita en CSS propia' },
  { need: 'Cargando una lista o una tarjeta', component: 'p-skeleton del alto real de lo que reemplaza', avoid: 'Texto «Cargando…» solo' },
  { need: 'Vacío o error con salida', component: 'Texto, una acción y p-message; ver Fundamentos', avoid: 'Pantalla en blanco' },
];
