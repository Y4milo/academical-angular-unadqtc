---
name: academical-ui-primeng
description: "Reglas de UI del front Academical (Angular 19 + PrimeNG 19 Aura): usar siempre componentes de PrimeNG antes que HTML/CSS propio, mapa de componentes por necesidad, temas claro/oscuro, iconos Lucide, textos en español. Activar al crear o rediseñar cualquier pantalla, tarjeta, formulario, tabla o filtro del front."
---

# UI de Academical: PrimeNG primero

Front: Angular 19.2 standalone, PrimeNG 19 con tema Aura (`@primeng/themes`), primeflex, iconos Lucide. UI en español, código en inglés.

## Fuente de verdad

El catálogo `/admin/components` (`src/app/dashboard/staff/shared/components-catalog`) y `docs/frontend-components.md` son la fuente de verdad de la interfaz, como en Core y Events: se leen antes de tocar una pantalla y todo patrón nuevo o cambiado se agrega al catálogo, a ese documento y a este skill en el mismo cambio. Lo hacen cumplir `components-catalog.component.spec.ts` (tokens de tema que existen y cambian en claro y oscuro), `npm run check:theme` (sin colores que no siguen el tema, tope que solo baja) y las pruebas de pantalla con `autoDetectChanges` + `whenStable`.

## Regla principal

**Siempre un componente de PrimeNG si existe uno que sirva.** Solo se escribe HTML/CSS propio para la disposición (grid, espaciados) y para lo que PrimeNG no cubre. No se reimplementan a mano botones, chips, etiquetas, líneas de tiempo, paginadores, selects, avisos ni avatares.

| Necesidad | Componente PrimeNG |
| --- | --- |
| Contenedor / tarjeta | `p-card` (con `header`/`subtitle` o plantillas `pTemplate`) |
| Línea de tiempo de un día | `p-timeline` (`[value]`, plantillas `marker`, `content`, `opposite`) |
| Estado, método, tipo (Activo, Manual, Docente) | `p-tag` (`severity` success / warn / info / secondary / danger, `icon`) |
| Filtro rápido de pocas opciones | `p-selectbutton` (`[multiple]` si aplica) o `p-chip` |
| Filtro con muchas opciones | `p-select` (`[showClear]="true"`), `p-multiselect` |
| Búsqueda de texto | `p-iconfield` + `p-inputicon` + `pInputText` |
| Búsqueda con sugerencias (DNI o nombre) | `p-autoComplete` |
| Rango de fechas | `p-datepicker` con `selectionMode="range"` |
| Paginación | `p-paginator` (`rowsPerPageOptions`, `showCurrentPageReport`) |
| Listado grande con paginación propia | `p-dataview` o `p-table` |
| Persona / iniciales | `p-avatar` (`label` con iniciales, `shape="circle"`) |
| Avisos, errores, vacíos con mensaje | `p-message` (`severity`, `icon`) |
| Cargando | `p-skeleton`, `p-progressspinner` |
| Confirmaciones y avisos efímeros | `p-confirmdialog`, `p-toast` |
| Separadores | `p-divider` |
| Ayudas | `pTooltip` |
| Acciones | `pButton` / `p-button` (uno solo `primary` por vista; el resto `severity="secondary"`, `[text]="true"`) |

Antes de escribir CSS para algo, revisa `node_modules/primeng` (carpeta del componente) o la documentación de PrimeNG 19.

## Reglas de implementación

- Componentes standalone: importar cada módulo de PrimeNG que se usa en `imports` (`TimelineModule`, `TagModule`, `SelectButtonModule`, etc.).
- **Colores con tokens del tema de PrimeNG 19 (`--p-*`), nunca hexadecimales ni fallbacks claros.** Este proyecto solo carga el tema de `@primeng/themes` (Aura): los nombres antiguos `--surface-card`, `--surface-border`, `--surface-ground`, `--text-color`, `--text-color-secondary` y `--primary-color` NO existen, así que `var(--surface-card, #fff)` siempre cae al fallback claro y en tema oscuro deja la pantalla mitad clara. Tampoco sirven `--p-surface-0..950` ni `--p-primary-50..950` para fondos y textos: son paletas fijas que no cambian con el tema.

  | Necesidad | Token que cambia con el tema |
  | --- | --- |
  | Fondo de tarjeta, panel, diálogo | `--p-content-background` |
  | Fondo al pasar el mouse, bloque suave dentro de una tarjeta | `--p-content-hover-background` |
  | Borde y separadores | `--p-content-border-color` |
  | Texto normal / texto apagado | `--p-text-color` / `--p-text-muted-color` |
  | Elemento destacado (celda, fila o chip resaltado) | `--p-highlight-background` + `--p-highlight-color` |
  | Color de marca | `--p-primary-color` (texto sobre él: `--p-primary-contrast-color`) |
  | Estados | `p-tag` / `p-message` con su `severity`; si hace falta CSS, `--p-green-500`, `--p-orange-500`, `--p-red-500` |

  Las pantallas antiguas (banco, asistencias) usan cadenas como `var(--surface-card, var(--p-content-background, #fff))`: funcionan porque caen en el token `--p-*`, pero no se copian; en código nuevo se usa el `--p-*` directo. El fallo es el fallback fijo (`var(--surface-card, #fff)`), que nunca se actualiza con el tema.

  Para saber si un token cambia con el tema, consultarlo en el navegador en los dos temas (ver Verificación). Si no existe, `getPropertyValue` devuelve vacío.
- **Tema claro/oscuro: lo decide solo la clase `app-dark` de `<html>`** (`main.ts` la pone; PrimeNG usa `darkModeSelector: '.app-dark'`). Nunca usar `@media (prefers-color-scheme: dark)` en CSS: si el tema guardado no coincide con el del sistema, la página queda mitad clara y mitad oscura. Para algo específico del tema oscuro: `html.app-dark ...` o `:host-context(.app-dark)`.
- Personalizar con **tokens de diseño** (`[dt]`, `--p-*`) o `styleClass`; evitar `::ng-deep` y `!important`. Si es imprescindible, acotarlo con `:host`.
- Iconos de componentes PrimeNG: `pi pi-*`. Iconos propios del dominio (huella, rostro, lector, entrada/salida): `app-lucide-icon` con el nombre registrado en `src/app/core/utils/lucide-icon.util.ts`; si falta, agregarlo allí.
- Disposición con primeflex (`grid`, `flex`, `gap-*`) o CSS grid del componente; responsive de una columna en móvil, sin scroll horizontal.
- Estados siempre cubiertos: cargando, vacío (con mensaje que invite a actuar), error, sin resultados por filtros.
- Textos en español, sentencia normal (no Title Case), verbo primero en botones, sin signos de exclamación en mensajes del sistema.
- Accesibilidad: `label` asociado a cada campo, `aria-label` en botones solo con ícono, el color nunca es la única señal (acompañar con texto o ícono).

## Escala y reglas compartidas con Events y Core

Basado en el skill `primeng-ux-design` de `events-unadqtc-angular` y `core-angular` (ruta: `D:/Usuario/Documents/Angular/events-unadqtc-angular/.claude/skills/primeng-ux-design/SKILL.md`). Léelo cuando necesites el detalle (diálogos, tablas, paneles de reglas, pantallas en vivo); aquí queda lo que aplica a Academical. Si algo entra en conflicto, gana este skill para Academical y se avisa.

- **Una sola escala, sin valores inventados.** Espaciado con `--space-1..6` de `src/styles.css` (4, 8, 12, 16, 24, 32 px; ojo: en Academical `--space-5` = 1.5rem y `--space-6` = 2rem, distinto de Events). Radios `--radius-md` (8 px) y `--radius-lg`; pastillas 999px. Tipografía: 0.75rem leyenda, 0.8rem metadatos, 0.85rem denso (tablas, listas), 1rem cuerpo, 1.125rem título de panel, 1.5rem título de página. Pesos solo 400 y 600. Nada de 0.35, 0.6 o 0.9 rem ni 7/10 px.
- **Ritmo:** un contenedor separa a todos sus hijos con un único `gap` (no márgenes en los hijos). Las rejillas de formulario no se estiran (`align-items: start`) para que una ayuda no mueva al vecino.
- **Puntos de quiebre únicos:** 640 px (teléfono), 900 px (tableta), 1200 px (escritorio). Base para teléfono. Sin 560, 720, 760, 980 ni 1100.
- **Ícono + texto siempre con espacio:** un ícono junto a su texto va en un contenedor `inline-flex` con `align-items: center` y `gap: var(--space-1)` (o `--space-2`); nunca dependas de un espacio en el HTML, porque en `inline-flex` desaparece. Revisa a tamaño real (y acercando la imagen) que ningún ícono quede pegado.
- **Aire interior siempre:** ningún texto, fila, etiqueta o botón toca el borde de su tarjeta, panel, tabla o diálogo. Varias etiquetas en una celda van en un contenedor flex con `gap`.
- **Botones:** `secondary`/`outlined` por defecto, a lo sumo uno primario por vista y por diálogo; destructivo con `severity="danger"` y confirmación. Con texto: acción principal, acciones de cabecera y de diálogo. Solo ícono: el vocabulario (ver, editar, quitar, copiar, descargar, actualizar) con `ariaLabel` y `pTooltip`; nunca un `<button>` a mano. Ícono + campo (buscar): `p-inputgroup` o `p-iconfield`.
- **Tablas y listas largas:** `p-table size="small"`, cabecera 0.75rem en mayúsculas apagada, acciones al final, paginador nativo, esqueleto con `p-skeleton` que imita la forma de los datos.
- **Diálogos:** `p-dialog` modal, ancho `min(94vw, X)` con 32rem (confirmar), 38rem (una entidad), 52rem (con pestañas), 64rem (tabla); acciones en `#footer`, «Cancelar» (outlined) y una sola primaria al final; en teléfono apiladas a todo el ancho.
- **Estados, siempre los tres:** cargando (esqueleto con la forma real), vacío (centrado: ícono + título corto + una línea + la acción que lo arregla) y error (`p-message severity="error"` con qué pasó y qué hacer). Las notas bajo un campo van en `--p-text-muted-color` 0.8rem o `p-message variant="simple"`. No dejar silencios: lo que un total incluye y no se ve se avisa.
- **Color por significado, no por color:** el mismo estado tiene el mismo `severity` en todas partes (ok = success, info, pendiente = warn, fallido = danger, neutro = secondary). Nunca un `--p-green-*` a mano para un estado que ya tiene etiqueta.
- **Copia:** español, sentencia normal, sin punto final en etiquetas y botones, verbo primero («Agregar expositor»), errores que dicen qué pasó y qué hacer, nunca texto crudo de la API.
- **Lista de revisión antes de dar una pantalla por terminada:** etiquetas ligadas a su campo (`for`/`id`), `aria-label` en botones de solo ícono, orden de foco lógico, contraste en claro y oscuro, funciona a 375 px y 1440 px, sin scroll horizontal de página (`scrollWidth === innerWidth`), acciones alcanzables con teclado, diálogos que cierran con Esc.
- **Si el código existente se sale de la escala, no se copia:** se usa la escala en lo que se toca y se menciona la desviación grande sin reescribirla en silencio.

## Menú lateral del personal

`staff-role-layout` es el shell de todas las pantallas del personal: `p-panelmenu` en una columna de 17rem (`p-drawer` bajo 900px), máximo dos niveles (grupo y pantalla), un grupo abierto a la vez y abierto el de la pantalla actual. Persona, «Cambiar contraseña» y «Cerrar sesión» al pie. Las opciones vienen del API (`RoleMenus.php`, un bloque por módulo); no se agregan opciones a mano en el front. `StaffMenuStore` carga el menú una vez por sesión. Íconos nuevos: registrarlos en `lucide-icon.util.ts`; sin registro se ve un círculo.

## Pantallas de asistencias

Una sola pieza compartida: `shared/staff-attendance-cards` la usan la lista de RRHH (`hr-admin/attendace-admin`) y «Mis asistencias» (`staff-user/attendance-user`). Cualquier cambio visual se hace ahí y aplica a ambas. El detalle del motivo y quién registró una marcación manual solo se muestra con `showDetails` (admin y RRHH).

Convención de colores de la marcación: entrada → `success`, almuerzo → `warn`, salida → `info`, repetida/sin rol → `secondary`; método manual → `p-tag` `warn` con el ícono de registro manual.

## Patrones de las pantallas del banco

Referencia en `dashboard/staff/accounting/{bn-incidents,bn-files,bn-traces,bn-config}`.

- **Pantalla limpia:** estado general en una insignia, solo lo accionable en alertas delgadas (`alert` por severidad), pestañas simples (`role="tablist"`), una búsqueda más un botón «Filtros» que abre `p-popover` (fecha, operación, origen), filas agrupadas por día y detalle en `p-drawer`. Sin tarjetas de cifras repetidas.
- **Listas propias en vez de `p-table`** cuando la fila es compuesta: `div.row` en grid + `p-paginator`; en teléfono (≤ 640 px) la fila pasa a tarjeta con `grid-template-areas`.
- **Detalle (`p-drawer`) a la derecha** con `styleClass` y ancho `34rem` (`100vw` en teléfono); reutiliza endpoints de descarga y vista previa por id de transacción.
- **Origen con color:** azul = el propio sistema, verde = autorizado, verde punteado = probable, naranja = desconocida (roja en trazabilidad), gris/ámbar = sin verificar; siempre con texto o ícono además del color.
- **Íconos de estado** con Lucide registrados en `core/utils/lucide-icon.util.ts` (`circle-check`, `clock`, `circle-x`, `triangle-alert`, `minus`, `shield-*`, `plug-zap`, `key-round`, `coffee`, `wrench`, `terminal`, `globe`, `route`, `sliders-horizontal`); al usar uno nuevo, importarlo y registrarlo allí.
- **Enlaces agrupados por módulo:** todo lo de un módulo cuelga de su propia ruta, también las páginas públicas (Bienestar: `/dbu/citas`, `/dbu/citas/estado`, `/dbu/config`; copia de admin `/admin/dbu/...`). Las rutas se declaran una vez en `PATHS` y los enlaces de las plantillas salen de ahí (`readonly links`); si se renombra una, la antigua queda como `redirectTo`.
- **Rutas:** agregar la ruta en `app-paths.constants.ts` y `app.routes.ts` (admin y, si aplica, accounting) y la entrada de menú en el backend (`MenuRoutes`/`RoleMenus`).
- **Sesión:** el usuario vive en `sessionStorage` (por pestaña); abrir una URL en otra pestaña manda al login con `returnUrl`, que vuelve a la página pedida. Para revisar en el navegador integrado sin perder la sesión, navegar con `history.pushState` + `popstate`; `ng.getComponent` sirve en desarrollo. Si `ng serve` deja de reaccionar a los cambios, reiniciarlo (`npm start`).

## Typography

One scale, defined once in `src/styles.css` and shown in the catalog (`/admin/components`, section Escalas): sizes `--text-title` 1.75, `--text-card-title` 1.125, `--text-body` .9375, `--text-small` .8125, `--text-label` .75 rem; weights only `--weight-regular` 400, `--weight-strong` 600 (active item, button, table header, field label, tag, panel title) and `--weight-title` 700 (page title, brand). Font is `--font-sans` (Segoe UI stack), no web font. Never write `font-weight: 650` or `font-size: .82rem` in a screen: use the tokens; `npm run check:typography` rejects literals in new or touched files (old files have a cap in `scripts/typography-baseline.json` that only goes down). PrimeNG components get the scale from `InstitutionalPreset` (`typography` in `app.config.ts`), so do not restyle button, tag, card, dialog, panel, tabs, data table or message weights per screen. Changing the scale = edit `styles.css`, `ui-tokens.ts` and `docs/frontend-components.md` in the same change.

## Notices and validation (toast policy)

- **Validation never goes in a toast.** A missing or invalid field is shown under the field and the field is marked. Use `app-form-field` (`core/components/form-field.component.ts`): `[error]` for a message you compute, or `[control]` + `invalidMessage` with a reactive form (shows the message only when the control is invalid and touched). On submit call `form.markAllAsTouched()` and return; do not add a toast or a per-screen `fieldError()` helper. Template-driven screens keep a `submitted` flag and pass a computed `[error]`. For `p-password` mark the input with `[inputStyleClass]="error ? 'w-full ng-invalid ng-dirty' : 'w-full'"` (PrimeNG 19 has no `invalid` input there).
- **Toast only for what the screen cannot show by itself:** real failures (`error`), results with no visible effect (e-mail sent, link or hash copied to the clipboard) and the end of a long process. If the screen already changes (list reloads, dialog closes, new state is visible) no success toast.
- **A state is not a toast.** Information that stays true while the user is on the screen (no current semester, read-only mode, nothing to show) is a fixed `p-message`, because a toast vanishes in seconds.
- **Severity matches the case:** something that failed is `error`, never `warning`; `warning` is for a risk the user can still accept.
- Buttons that need a prior step (a file, a selection) are `[disabled]` until it exists, instead of warning after the click.
- `NotificationService.notifyApiData` toasts every API response, success included; use `notifyApiFailure` instead when the success is already visible (row moves, dialog closes, file replaced) so only failures toast.

## Verificación

Antes de dar un cambio de UI por terminado: probarlo en el navegador en tema claro y oscuro (quitando o poniendo la clase `app-dark` en `<html>`; emular `prefers-color-scheme` no sirve), a ancho de escritorio y de móvil (375 px), con datos reales o de prueba, y revisar la consola sin errores.

Medidas de pantalla: revisar siempre a 375, 768 y 1440 px, en claro y oscuro, con `scrollWidth === innerWidth` y nada fuera de su tarjeta. En teléfono (≤ 640 px): paddings menores, filas de formulario con `flex-wrap` (nunca `flex-direction: column` con un `flex-basis` en rem: el basis se vuelve alto y deja un bloque vacío enorme), menú de secciones en una fila que se desliza, esqueleto de carga corto y tablas de texto como tarjetas etiqueta/valor (`data-label`).

Comprobación de tema, paso a paso (con `javascript_tool` en el navegador integrado):
1. Poner el tema: `document.documentElement.classList.toggle('app-dark', true)` (o `false`).
2. Revisar que ningún CSS propio use un token que no cambia: en una hoja del componente, buscar `var(--surface-`, `var(--text-color`, `var(--primary-color`, `--p-surface-`, `--p-primary-50..950` y colores hexadecimales o `#fff`: todos son errores en tema oscuro.
3. Medir el fondo y el texto de cada bloque en los dos temas: `getComputedStyle(el).backgroundColor` y `.color`; en tema oscuro el fondo de una tarjeta no puede ser claro ni el texto oscuro sobre fondo oscuro. Un bloque cuyo fondo es el mismo en los dos temas es sospechoso.
4. Revisar en pantalla: tarjeta, filas, celdas resaltadas, etiquetas, mensajes, diálogos y menús desplegables (con `appendTo="body"`, el panel nace fuera de la tarjeta y hereda solo el tema global).
5. Una prueba de componente (`autoDetectChanges` + `whenStable`) asegura que la pantalla termina de dibujarse; no sustituye mirar los dos temas.
