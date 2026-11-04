/** Una receta por tipo de pantalla: los componentes exactos, las reglas y las pantallas reales que ya la siguen. Todo es PrimeNG. */
export interface ScreenRecipe {
  id: string;
  title: string;
  components: string[];
  rules: string[];
  screens: string;
}

export const SCREEN_RECIPES: ScreenRecipe[] = [
  {
    id: 'list',
    title: 'Lista con filtros y acciones por fila',
    components: ['p-table', 'p-paginator', 'p-iconfield', 'p-inputicon', 'pInputText', 'p-selectbutton', 'p-select', 'p-tag', 'p-button', 'p-skeleton', 'p-message'],
    rules: [
      'Título, descripción y la acción principal arriba a la derecha.',
      'Una sola búsqueda, en el servidor, con 300 ms de espera, y vuelve a la página 1.',
      'Dos filtros por fila en teléfono; la tabla se vuelve tarjetas bajo 640 px (<code>styleClass="dbu-stack"</code>).',
      'Una acción de texto por fila y el resto con solo ícono; máximo 4.',
      'Cargando: esqueleto con la forma de las filas. Vacío: título y la acción que lo arregla.',
    ],
    screens: 'Directivas, órdenes de servicio, solicitudes de soporte, cuentas funcionales, cola de citas, registros de grados y títulos.',
  },
  {
    id: 'detail',
    title: 'Detalle de un registro (con línea de tiempo)',
    components: ['p-card', 'p-tag', 'p-timeline', 'p-button', 'p-splitbutton', 'p-tabs', 'p-message', 'p-skeleton'],
    rules: [
      'Arriba el nombre, el estado (<code>p-tag</code>) y las acciones; la principal es una sola.',
      'El historial es un <code>p-timeline</code> con fecha y persona; nunca un <code>&lt;ul&gt;</code>.',
      'Las descargas con variantes (Word, PDF, firmada) van en un <code>p-splitbutton</code>.',
      'Si algo bloquea una acción, un <code>p-message</code> dice por qué junto al botón.',
    ],
    screens: 'Detalle de directiva, de orden de servicio y de incidencia del banco.',
  },
  {
    id: 'form',
    title: 'Formulario de alta y edición',
    components: ['pInputText', 'pTextarea', 'p-select', 'p-multiselect', 'p-datepicker', 'p-inputnumber', 'p-toggleswitch', 'p-message', 'p-button'],
    rules: [
      'Etiqueta arriba; ayuda y error debajo (<code>p-message variant="simple"</code>); obligatorio con *.',
      'El error aparece solo después de tocar el campo o de intentar guardar.',
      'Una fila con <code>flex-wrap</code>: dos campos en escritorio, uno en teléfono.',
      'Guardar es el botón primario; Cancelar es secundario y vuelve sin guardar.',
    ],
    screens: 'Directiva nueva, orden de servicio, semestres y usuarios.',
  },
  {
    id: 'settings',
    title: 'Pantalla de configuración (filas de ajuste y barra de guardado)',
    components: ['p-toggleswitch', 'p-inputnumber', 'p-select', 'p-datepicker', 'p-button', 'p-message', 'p-divider'],
    rules: [
      'Una fila de ajuste: título y ayuda a la izquierda, control a la derecha; si no cabe, el control baja.',
      'Barra de guardado fija abajo con «Guardar» y «Descartar» solo cuando hay cambios.',
      'Un interruptor general apaga el módulo; lo propio de cada módulo se configura en su pantalla.',
      'Los cambios aplican hacia adelante y la pantalla lo dice con un <code>p-message</code>.',
    ],
    screens: 'Configuración de citas, de directivas, de módulos del estudiante y del carné.',
  },
  {
    id: 'dashboard',
    title: 'Panel con indicadores',
    components: ['p-card', 'p-tag', 'p-progressbar', 'p-table', 'p-skeleton', 'p-message'],
    rules: [
      'Tarjetas de resumen que caben en una fila y se apilan en teléfono (<code>auto-fit</code>).',
      'Una cifra grande con su etiqueta; la clicable lleva <code>role="button"</code>, <code>tabindex="0"</code> y <code>(keydown.enter)</code>.',
      'El color del estado sale del vocabulario compartido (<code>STATE_SEVERITY</code>).',
    ],
    screens: 'Depuración de usuarios, carné universitario y banco.',
  },
  {
    id: 'steps',
    title: 'Flujo por pasos',
    components: ['p-steps', 'p-button', 'p-message', 'p-fileupload', 'pInputText', 'p-datepicker'],
    rules: [
      '<code>p-steps</code> de solo lectura con «Atrás» y «Siguiente»; el último paso confirma.',
      'No se avanza con errores: el paso muestra su aviso y el botón queda deshabilitado.',
      'Con datos ya aprobados el flujo es una sola pantalla.',
    ],
    screens: 'Registro del carné del estudiante.',
  },
  {
    id: 'inbox',
    title: 'Bandeja de trabajo (pestañas con contador y detalle lateral)',
    components: ['p-tabs', 'p-badge', 'p-table', 'p-drawer', 'p-tag', 'p-button'],
    rules: [
      'Las pestañas son estados y cada una lleva su contador (<code>p-badge</code>).',
      'El detalle se abre en un <code>p-drawer</code> a la derecha para no perder la lista.',
      'La acción de la fila abre el detalle; las acciones del detalle viven dentro del <code>p-drawer</code>.',
    ],
    screens: 'Cola de citas, firmas pendientes y depuración de usuarios.',
  },
  {
    id: 'public',
    title: 'Página pública de un solo paso (teléfono)',
    components: ['pInputText', 'p-inputmask', 'p-select', 'p-datepicker', 'p-button', 'p-message', 'p-card'],
    rules: [
      'Una sola decisión por pantalla, pensada primero para 375 px.',
      'Sin menú del personal: va fuera del marco único.',
      'Campos grandes, un botón primario a todo el ancho y los errores debajo de cada campo.',
    ],
    screens: 'Citas de Bienestar para el alumno (<code>/dbu/citas</code>) y su consulta de estado.',
  },
  {
    id: 'dialogs',
    title: 'Diálogos: confirmar, formulario y destructivo con motivo',
    components: ['p-dialog', 'p-confirmdialog', 'p-confirmpopup', 'pTextarea', 'p-button', 'p-message'],
    rules: [
      'Confirmar: <code>p-confirmdialog</code> con el verbo de la acción («Anular»), nunca «Aceptar».',
      'Formulario: <code>p-dialog</code> modal con <code>appendTo="body"</code>; el botón primario a la derecha del pie.',
      'Destructivo con motivo: <code>pTextarea</code> obligatorio (mínimo 10 caracteres) y botón <code>severity="danger"</code> deshabilitado hasta cumplirlo.',
    ],
    screens: 'Rechazo y anulación de directivas, cierre de titulares de cuenta.',
  },
  {
    id: 'upload',
    title: 'Subida de archivos',
    components: ['p-fileupload', 'p-message', 'p-progressbar', 'p-button'],
    rules: [
      '<code>mode="basic"</code>, <code>customUpload</code>, <code>(onSelect)</code> y <code>clear()</code>; la etiqueta de PrimeNG va vacía y la pantalla muestra el nombre y el tamaño.',
      'Tipo y tamaño máximos declarados en el propio control y repetidos en el aviso de ayuda.',
      'Nunca un <code>&lt;input type="file"&gt;</code> oculto detrás de un botón.',
    ],
    screens: 'Directiva y resolución, foto del carné, importaciones.',
  },
  {
    id: 'readonly',
    title: 'Pantalla de solo consulta (aviso de modo consulta)',
    components: ['p-message', 'p-table', 'p-tag', 'p-card'],
    rules: [
      'Un <code>p-message severity="info"</code> arriba explica por qué no se puede editar.',
      'Los campos van deshabilitados con su valor; no se ocultan.',
      'Quien tiene permiso de editar no ve el aviso.',
    ],
    screens: 'Carné cerrado la ventana, directivas visibles por consulta.',
  },
  {
    id: 'states',
    title: 'Estados: cargando, vacío y error',
    components: ['p-skeleton', 'p-message', 'p-button'],
    rules: [
      'Cargando: <code>p-skeleton</code> del alto real de lo que reemplaza, nunca más alto en teléfono.',
      'Vacío: texto que explica y la acción que lo arregla.',
      'Error: <code>p-message severity="error"</code> y «Reintentar»; nunca una pantalla en blanco.',
    ],
    screens: 'Todas las pantallas con datos del servidor.',
  },
];
