---
name: academical-ui-primeng
description: "Reglas de UI del front Academical (Angular 19 + PrimeNG 19 Aura): usar siempre componentes de PrimeNG antes que HTML/CSS propio, mapa de componentes por necesidad, temas claro/oscuro, iconos Lucide, textos en español. Activar al crear o rediseñar cualquier pantalla, tarjeta, formulario, tabla o filtro del front."
---

# UI de Academical: PrimeNG primero

Front: Angular 19.2 standalone, PrimeNG 19 con tema Aura (`@primeng/themes`), primeflex, iconos Lucide. UI en español, código en inglés.

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
- **Colores y tamaños con tokens del tema**, nunca hexadecimales: `var(--p-primary-color)`, `var(--p-green-500)`, `var(--text-color)`, `var(--text-color-secondary)`, `var(--surface-card)`, `var(--surface-border)`. Así funcionan en tema claro y oscuro sin código extra.
- Personalizar con **tokens de diseño** (`[dt]`, `--p-*`) o `styleClass`; evitar `::ng-deep` y `!important`. Si es imprescindible, acotarlo con `:host`.
- Iconos de componentes PrimeNG: `pi pi-*`. Iconos propios del dominio (huella, rostro, lector, entrada/salida): `app-lucide-icon` con el nombre registrado en `src/app/core/utils/lucide-icon.util.ts`; si falta, agregarlo allí.
- Disposición con primeflex (`grid`, `flex`, `gap-*`) o CSS grid del componente; responsive de una columna en móvil, sin scroll horizontal.
- Estados siempre cubiertos: cargando, vacío (con mensaje que invite a actuar), error, sin resultados por filtros.
- Textos en español, sentencia normal (no Title Case), verbo primero en botones, sin signos de exclamación en mensajes del sistema.
- Accesibilidad: `label` asociado a cada campo, `aria-label` en botones solo con ícono, el color nunca es la única señal (acompañar con texto o ícono).

## Pantallas de asistencias

Una sola pieza compartida: `shared/staff-attendance-cards` la usan la lista de RRHH (`hr-admin/attendace-admin`) y «Mis asistencias» (`staff-user/attendance-user`). Cualquier cambio visual se hace ahí y aplica a ambas. El detalle del motivo y quién registró una marcación manual solo se muestra con `showDetails` (admin y RRHH).

Convención de colores de la marcación: entrada → `success`, almuerzo → `warn`, salida → `info`, repetida/sin rol → `secondary`; método manual → `p-tag` `warn` con el ícono de registro manual.

## Verificación

Antes de dar un cambio de UI por terminado: probarlo en el navegador en tema claro y oscuro, a ancho de escritorio y de móvil (375 px), con datos reales o de prueba, y revisar la consola sin errores.
