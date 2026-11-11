/* Maqueta del rediseño del módulo «Documentos de gestión». Datos de PRUEBA 001; sin DNI ni datos reales. */
const P = {
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  hist: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  tree: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
  dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  filter: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
  upload: '<path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  down: '<path d="M12 4v12m0 0 5-5m-5 5-5-5"/><path d="M5 20h14"/>',
  shield: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  back: '<path d="M15 6 9 12l6 6"/>',
  swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
};
const I = (n, s = '') => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${s}>${P[n]}</svg>`;

const DOC = { title: 'PRUEBA 001', type: 'Directivas', typeColor: '#d97706', sub: null, origin: 'Oficina de Tecnologías de la Información', pages: 1 };
const ROUTE = [
  { off: 'Oficina de origen', short: 'OTI', lab: 'Oficina de origen', who: 'Yamil Alberto Peña Loayza', role: 'Jefe de la Oficina de Tecnologías de la Información' },
  { off: 'Oficina de Asesoría Jurídica', short: 'OAJ', lab: 'Asesoría Jurídica', who: 'Julio César García Yuca', role: 'Jefe de la Oficina de Asesoría Jurídica' },
  { off: 'Unidad de Planeamiento, Modernización y Estadística', short: 'UPME', lab: 'Planeamiento y Modernización', who: 'Yamil Alberto Peña Loayza', role: 'Jefe de la UPME' },
  { off: 'Presidencia de la Comisión Organizadora', short: 'PCO', lab: 'Presidencia', who: 'Yamil Alberto Peña Loayza', role: 'Presidente de la Comisión Organizadora' },
];
const EVENTS = [
  ['Creó el borrador', 'Yamilo Peña Loayza · OTI · 10/11/2026 18:37'],
  ['Reemplazó el documento y la resolución', 'Yamilo Peña Loayza · OTI · 10/11/2026 18:40', [['Documento', 'PRUEBA 001 - Directiva (1).pdf', 'PRUEBA 001 - Directiva.pdf']]],
  ['Corrigió el borrador', 'Yamilo Peña Loayza · OTI · 10/11/2026 18:43', [['Título', 'PRUEBA 01', 'PRUEBA 001']]],
  ['No se pudo enviar a firma', 'Yamilo Peña Loayza · 10/11/2026 21:52'],
  ['Envió el documento a firma', 'Yamilo Peña Loayza · OTI · 10/11/2026 22:07'],
];
const SUBS = ['Estatuto', 'POI', 'PEI', 'ROF', 'MCC', 'TUPA', 'MAPRO', 'CAP', 'PAP', 'PIA'];
const ROWS = [
  { t: 'Directiva de control de bienes patrimoniales', ty: 'Directivas', c: '#d97706', o: 'OTI', st: 'En firma', k: 'info', done: 1, up: 'Asesoría Jurídica', when: 'hace 2 h', pg: '14 páginas', v: 1 },
  { t: 'Reglamento de prácticas pre profesionales', ty: 'Reglamentos', c: '#2563eb', o: 'Vicepresidencia Académica', st: 'Devuelto', k: 'warn', done: 2, up: 'Origen corrige', when: 'ayer', pg: '22 páginas', v: 2 },
  { t: 'Plan operativo institucional 2027', ty: 'Documentos de gestión institucional · POI', c: '#7c3aed', o: 'Planeamiento', st: 'Borrador', k: 'neutral', done: 0, up: '—', when: '10/11/2026', pg: '31 páginas', v: 1 },
  { t: 'Política de seguridad de la información', ty: 'Políticas', c: '#059669', o: 'OTI', st: 'Firmado', k: 'ok', done: 4, up: 'Completo', when: '03/11/2026', pg: '9 páginas', v: 1 },
];

/* ---------- estado de la maqueta ---------- */
const S = { theme: 'light', size: 'd', screen: 'audit', state: {}, drawer: null, dialog: null, menu: false, sub: 'POI', dsub: 'sub-tipo' };
const STATES = {
  list: [['mine', 'Mis documentos'], ['filtered', 'Con filtros'], ['sign', 'Por firmar'], ['route', 'En tu ruta'], ['empty', 'Vacía']],
  form: [['create', 'Nuevo'], ['edit', 'Corregir borrador']],
  detail: [['draft', 'Borrador'], ['sent', 'En firma'], ['returned', 'Devuelto'], ['signed', 'Firmado'], ['cancelled', 'Anulado']],
  sign: [['turn', 'Tu turno'], ['doing', 'Firmando'], ['done', 'Firmado']],
  resubmit: [['one', 'Corregir y reenviar']],
  settings: [['one', 'Visibilidad']],
};
const SCREENS = [['audit', 'Auditoría'], ['flow', 'Flujo'], ['list', 'Lista'], ['form', 'Nuevo / corregir'], ['detail', 'Detalle'], ['sign', 'Firmar'], ['resubmit', 'Reenviar'], ['settings', 'Visibilidad']];
const cur = () => S.state[S.screen] || (STATES[S.screen] || [[null]])[0][0];

/* ---------- piezas ---------- */
const tag = (t, k) => `<span class="tag ${k}">${t}</span>`;
const typeChip = (c, t) => `<span class="meta" style="margin:0;gap:.4rem"><span class="dot" style="background:${c}"></span>${t}</span>`;
const pdfPage = (t) => `<div class="pdf"><div class="page"><b style="color:#333;font-size:.7rem">${t}</b><i style="width:80%"></i><i></i><i></i><i style="width:90%"></i><i></i><i style="width:60%"></i><i></i><i></i><i style="width:75%"></i><div class="foot">DOCUMENTO DE PRUEBA, SIN VALIDEZ · Código de verificación · Página 1 de 1</div></div></div>`;
const trackBtns = (events = 5, route = 4, withRoute = true) => `<button class="track" data-act="drawer:track">${I('hist')}Seguimiento <span class="n">${events}</span></button>${withRoute ? `<button class="track" data-act="drawer:route">${I('tree')}Ruta de firmas <span class="n">${route}</span></button>` : ''}`;
const moreMenu = (items) => `<span style="position:relative"><button class="btn text sm" data-act="menu" aria-label="Más acciones">${I('dots')}</button><div class="menu ${S.menu ? 'on' : ''}" style="top:2.2rem">${items.map(([l, a, d]) => `<button class="${d ? 'd' : ''}" data-act="${a}">${l}</button>`).join('')}</div></span>`;
const progress = (done, now, rej) => `<div class="progress">${ROUTE.map((r, i) => {
  const cls = rej === i ? 'rej' : i < done ? 'done' : i === now ? 'now' : '';
  const st = rej === i ? 'Devolvió' : i < done ? 'Firmó' : i === now ? 'Le toca' : 'Espera';
  const col = rej === i ? '#dc2626' : i < done ? 'var(--ok-text)' : i === now ? 'var(--p-primary-color)' : 'var(--p-text-muted-color)';
  return `<button class="step ${cls}" data-act="drawer:route"><span class="node">${i < done ? I('check') : rej === i ? I('x') : i + 1}</span><span class="txt"><span class="who">${r.who.split(' ').slice(0, 2).join(' ')}</span><span class="off">${r.lab}</span><span class="st" style="color:${col}">${st}</span></span></button>`;
}).join('')}</div>`;

const head = (crumb, title, meta, actions, lead) => `<div class="crumbs"><a data-act="screen:list">Documentos de gestión</a>${I('right')}<span>${crumb}</span></div>
<div class="head"><div><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}${meta ? `<div class="meta">${meta}</div>` : ''}</div><div class="actions">${actions}</div></div>`;

/* ---------- pantallas ---------- */
function screenList() {
  const st = cur();
  const tabs = `<div class="tabs" role="tablist">${[['mine', 'Mis documentos', ''], ['sign', 'Por firmar', '1'], ['route', 'En tu ruta', '2']].map(([k, l, b]) => `<button role="tab" aria-selected="${(st === k) || ((st === 'empty' || st === 'filtered') && k === 'mine')}" data-act="state:${k}">${l}${b ? `<span class="badge">${b}</span>` : ''}</button>`).join('')}</div>`;
  const filt = st === 'filtered';
  const toolbar = `<div class="toolbar"><div class="input search ph">${I('search')}<span style="flex:1">Buscar por título, oficina o tipo</span></div><button class="btn" data-act="dialog:filters">${I('filter')}Filtros${filt ? ' <span class="tag info" style="padding:0 .4rem">2</span>' : ''}</button><span style="flex:1"></span></div>
  ${filt ? `<div class="fchips"><span class="hint">Filtrando por:</span><span class="fchip">Tipo: Directivas<button aria-label="Quitar">×</button></span><span class="fchip">Estado: En firma<button aria-label="Quitar">×</button></span><button class="btn text sm" data-act="state:mine">Limpiar todo</button></div>` : ''}`;
  const prog = (r) => `<div class="mini" title="${r.done} de 4 firmas">${[0, 1, 2, 3].map((i) => `<i class="${i < r.done ? 'd' : i === r.done && r.st === 'En firma' ? 'n' : ''}"></i>`).join('')}</div>`;
  let body;
  if (st === 'empty') {
    body = `<div class="card"><div class="empty"><div class="ei">${I('file')}</div><h3>Aún no tienes documentos de gestión</h3><p>Sube el documento y la resolución que lo aprueba. Academical arma la ruta de firmas con las personas que Core tiene designadas.</p><button class="btn primary lg" data-act="screen:form">${I('plus')}Nuevo documento</button></div></div>`;
  } else if (S.size === 'm') {
    body = `<div class="cards">${(st === 'filtered' || st === 'sign' ? [ROWS[0]] : ROWS).map((r) => `<div class="rowcard" data-act="screen:detail"><div style="display:flex;justify-content:space-between;gap:.5rem;align-items:flex-start"><b style="overflow-wrap:anywhere">${r.t}</b>${tag(r.st, r.k)}</div>${typeChip(r.c, r.ty)}<div style="display:flex;justify-content:space-between;align-items:center"><span class="hint">${r.o} · ${r.when}</span>${prog(r)}</div>${st === 'sign' ? `<button class="btn primary block">Revisar y firmar</button>` : ''}</div>`).join('')}</div>`;
  } else {
    const rows = st === 'sign' || st === 'filtered' ? [ROWS[0]] : st === 'route' ? [ROWS[0], ROWS[3]] : ROWS;
    body = `<div class="table"><table><thead><tr><th>Documento</th><th>Oficina de origen</th><th>Estado y avance</th>${st === 'sign' ? '<th>Acción</th>' : '<th>Le toca a</th>'}<th>Actualizado</th></tr></thead><tbody>${rows.map((r) => `<tr class="row" data-act="screen:detail"><td><div class="cell"><b>${r.t}</b><span class="hint">${typeChip(r.c, r.ty)}<span style="display:block;margin-top:2px">${r.pg} · versión ${r.v}</span></span></div></td><td>${r.o}</td><td><div class="cell">${tag(r.st, r.k)}${r.st === 'Borrador' ? '' : prog(r)}</div></td>${st === 'sign' ? `<td><button class="btn primary sm">Revisar y firmar</button></td>` : `<td>${r.up}</td>`}<td class="hint">${r.when}</td></tr>`).join('')}</tbody></table></div>`;
  }
  return `<div class="head"><div><h1>Documentos de gestión</h1><p class="lead">Documentos que pasan por la firma de las oficinas que Core tiene designadas, en orden.</p></div><div class="actions"><button class="btn primary grow" data-act="screen:form">${I('plus')}Nuevo documento</button></div></div>
  ${tabs}${st === 'empty' ? '' : toolbar}${body}`;
}

function screenForm() {
  const edit = cur() === 'edit';
  const sec = (n, t, hint, inner) => `<div class="card"><div class="sec"><span class="num">${n}</span><div class="body"><div><h3>${t}</h3><p class="hint">${hint}</p></div>${inner}</div></div></div>`;
  const file = (label, name, hint, filled) => filled
    ? `<div class="field"><span class="label">${label}</span><div class="dropzone filled"><span class="fi" style="width:2.4rem;height:2.4rem;display:grid;place-items:center;border-radius:.5rem;background:var(--p-highlight-background);color:var(--p-highlight-color)">${I('file')}</span><div class="cell"><b>${name}</b><span class="hint">2 KB · ${tag('1 página', 'ok')}</span></div><button class="btn sm">${I('swap')}Cambiar</button></div></div>`
    : `<div class="field"><span class="label">${label}</span><div class="dropzone"><span class="ei" style="width:2.4rem;height:2.4rem;border-radius:50%;display:grid;place-items:center;background:var(--p-highlight-background);color:var(--p-highlight-color)">${I('upload')}</span><b style="color:var(--p-text-color)">Arrastra el PDF o elige un archivo</b><span class="hint">${hint}</span></div></div>`;
  return `${head(edit ? 'Corregir borrador' : 'Nuevo documento', edit ? 'Corregir el borrador' : 'Nuevo documento de gestión', '', `${trackBtns(edit ? 5 : 0, 4)}`, 'Completa los cuatro pasos. Antes de enviarlo verás quién firma en cada oficina y podrás revisar todo.')}
  <div class="alert ok"><span>${I('shield')}</span><div class="t"><b>Ruta lista: 4 oficinas, todas con firmante designado</b><p>Cambia si eliges otra oficina de origen o activas «proceso de calidad». <a style="text-decoration:underline;cursor:pointer" data-act="drawer:route">Ver ruta</a></p></div></div>
  ${sec(1, 'Oficina de origen', 'Core te autoriza a pedir documentos por esta oficina.', `<div class="file" style="border-left:4px solid var(--p-primary-color)"><span class="fi">${I('building')}</span><div class="ft"><b>${DOC.origin}</b><span class="hint">Fijada por tu perfil en Core${edit ? ' · no se cambia al corregir' : ''}</span></div>${tag('Por tu perfil', 'info')}</div>`)}
  ${sec(2, 'Clasificación', 'El tipo decide si hace falta subtipo.', `<div class="field"><label>Tipo de documento *</label><div class="input"><span>Documentos de gestión institucional</span><span>${I('right', 'style="transform:rotate(90deg)"')}</span></div></div>
    <div class="field"><span class="label">Subtipo * <span class="hint" style="font-weight:400">· obligatorio en este tipo</span></span><div class="pills">${SUBS.map((s) => `<button class="pill" aria-pressed="${s === S.sub}" data-act="sub:${s}">${s}</button>`).join('')}</div></div>`)}
  ${sec(3, 'Datos del documento', 'Cómo lo verán las oficinas en su bandeja.', `<div class="field"><label>Título *</label><div class="input ${edit ? '' : 'ph'}">${edit ? 'PRUEBA 001' : 'Ej.: Directiva para el control de bienes patrimoniales'}</div><span class="hint">Mínimo 5 letras. Es lo que aparece en la lista y en los avisos por correo.</span></div>
    <div class="file"><div class="ft"><b>Proceso de calidad</b><span class="hint">Si lo activas, la Oficina de Gestión de la Calidad firma antes de Asesoría Jurídica.</span></div><button class="switch" role="switch" aria-checked="false" aria-label="Proceso de calidad"></button></div>`)}
  ${sec(4, 'Archivos', 'PDF de hasta 25 MB. El documento se firma; la resolución solo se adjunta.', `${file('Documento de gestión (PDF) *', 'PRUEBA 001 - Directiva.pdf', 'Se firma en Academical por las oficinas de la ruta.', edit)}${file('Resolución que lo aprueba (PDF) *', 'PRUEBA 001 - Resolucion.pdf', 'Solo se adjunta, no se firma. Puede venir ya firmada.', edit)}<p class="hint"><b style="color:var(--p-text-color)">Total del expediente:</b> ${edit ? '2 páginas (1 del documento + 1 de la resolución)' : 'se calcula al elegir los archivos'}</p>`)}
  <div class="sticky"><span class="hint">${edit ? 'Los cambios quedan en el seguimiento.' : 'Se guarda como borrador: aún no se envía a nadie.'}</span><span class="actions"><button class="btn">Cancelar</button><button class="btn primary">${edit ? 'Guardar cambios' : 'Guardar borrador'}</button></span></div>`;
}

function screenDetail() {
  const st = cur();
  const meta = `${typeChip(DOC.typeColor, DOC.type)}<span>·</span>${{ draft: tag('Borrador', 'neutral'), sent: tag('En firma', 'info'), returned: tag('Devuelto', 'warn'), signed: tag('Firmado', 'ok'), cancelled: tag('Anulado', 'err') }[st]}<span>·</span><span>Versión ${st === 'returned' ? 1 : 1}</span><span>·</span><span>${DOC.origin}</span>`;
  const primary = { draft: `<button class="btn primary grow" data-act="dialog:send">Enviar a firma</button>`, sent: `<button class="btn primary grow" data-act="screen:sign">${I('check')}Firmar</button>`, returned: `<button class="btn primary grow" data-act="screen:resubmit">Corregir y reenviar</button>`, signed: `<button class="btn primary grow">${I('down')}Descargar firmado</button>`, cancelled: '' }[st];
  const more = { draft: [['Corregir datos y archivos', 'screen:form'], ['Eliminar borrador', 'x', 1]], sent: [['Anular documento', 'dialog:cancel', 1]], returned: [['Anular documento', 'dialog:cancel', 1]], signed: [['Verificar firmas', 'x']], cancelled: [] }[st];
  const banner = {
    draft: `<div class="alert info"><span>${I('info')}</span><div class="t"><b>Es un borrador</b><p>Puedes reemplazar los PDF las veces que quieras. Al enviarlo a firma ya no se podrán cambiar.</p></div></div>`,
    sent: `<div class="alert info"><span>${I('clock')}</span><div class="t"><b>Le toca firmar a Yamil Alberto Peña Loayza · Oficina de origen</b><p>Se le avisó por correo hoy 22:07. Después seguirá Asesoría Jurídica.</p></div></div>`,
    returned: `<div class="alert warn"><span>${I('alert')}</span><div class="t"><b>Asesoría Jurídica devolvió el documento con observaciones</b><p>«El artículo 4 contradice la resolución adjunta; corregir y volver a enviar.» — Julio César García Yuca · 11/11/2026 09:15</p></div></div>`,
    signed: `<div class="alert ok"><span>${I('shield')}</span><div class="t"><b>Documento firmado por las 4 oficinas</b><p>Código de verificación <span class="mono">K7QX-92MF-3LDA</span> · Cualquiera puede comprobarlo en la página pública de verificación.</p><div class="actions"><button class="btn sm">${I('shield')}Verificar en la página pública</button></div></div></div>`,
    cancelled: `<div class="alert neutral"><span>${I('x')}</span><div class="t"><b>Documento anulado</b><p>«Se envió por error a firma.» — Yamilo Peña Loayza · OTI · 11/11/2026 10:02. No se puede reabrir ni reenviar.</p></div></div>`,
  }[st];
  const hero = st === 'draft' ? '' : `<div class="card"><div class="ctitle"><span>Avance de las firmas</span><span class="hint">${st === 'signed' ? '4 de 4' : st === 'returned' ? '1 de 4' : '0 de 4'} firmas</span></div>${progress(st === 'signed' ? 4 : st === 'returned' ? 1 : 0, st === 'sent' ? 0 : -1, st === 'returned' ? 1 : -1)}<p class="hint">Pulsa una oficina para ver su detalle en la ruta de firmas.</p></div>`;
  const files = `<div class="card"><div class="ctitle"><span>Documentos</span><span class="hint">Expediente: 2 páginas</span></div>
    <div class="file"><span class="fi">${I('file')}</span><div class="ft"><b>Documento de gestión</b><span class="hint">PRUEBA 001 - Directiva.pdf · 2 KB · 1 página</span></div><span class="actions"><button class="btn sm">${I('eye')}Ver PDF</button>${st === 'draft' ? `<button class="btn sm">${I('swap')}Reemplazar</button>` : ''}</span></div>
    <div class="file"><span class="fi">${I('file')}</span><div class="ft"><b>Resolución que lo aprueba</b><span class="hint">PRUEBA 001 - Resolucion.pdf · 1 KB · 1 página</span></div><span class="actions"><button class="btn sm">${I('eye')}Ver PDF</button>${st === 'draft' ? `<button class="btn sm">${I('swap')}Reemplazar</button>` : ''}</span></div>
    <details><summary class="hint" style="cursor:pointer">Detalles técnicos</summary><dl class="kv" style="margin-top:.5rem"><dt>Huella SHA-256</dt><dd class="mono">7c8f8fc6e76bbcc4947452bd9d1bbc4dc9a82f9eb40fbc90433801b56cdb0d69</dd></dl></details></div>`;
  const side = `<div class="card"><div class="ctitle"><span>Resumen</span></div><dl class="kv"><dt>Tipo</dt><dd>${DOC.type}</dd><dt>Oficina de origen</dt><dd>${DOC.origin}</dd><dt>Versión</dt><dd>1</dd><dt>Proceso de calidad</dt><dd>No</dd><dt>Creado por</dt><dd>Yamilo Peña Loayza</dd><dt>Actualizado</dt><dd>10/11/2026 22:07</dd></dl></div>`;
  return `${head(DOC.title, DOC.title, meta, `${trackBtns(5, 4)}${primary}${more.length ? moreMenu(more) : ''}`)}
  ${banner}${hero}<div class="cols"><div class="stack">${files}</div><div class="stack">${side}</div></div>`;
}

function screenSign() {
  const st = cur();
  const done = st === 'done';
  const panel = done
    ? `<div class="alert ok"><span>${I('check')}</span><div class="t"><b>Tu firma quedó registrada</b><p>El documento sigue con Asesoría Jurídica. Se le avisó por correo.</p></div></div><button class="btn primary block" data-act="screen:detail">Ver el seguimiento</button><button class="btn block" data-act="screen:list">Volver a la lista</button>`
    : `<ul class="check"><li><span class="ci ok">${I('check')}</span><span class="ct"><b>Es tu turno</b><span class="hint">Paso 1 de 4 · Oficina de origen</span></span></li>
      <li><span class="ci ok">${I('check')}</span><span class="ct"><b>Navegador compatible</b><span class="hint">Microsoft Edge en Windows</span></span></li>
      <li><span class="ci ${st === 'doing' ? 'now' : 'wait'}">${st === 'doing' ? '…' : '3'}</span><span class="ct"><b>Firma Perú abierto</b><span class="hint">${st === 'doing' ? 'Elige tu certificado en la ventana de Firma Perú y escribe tu PIN.' : 'Ábrelo antes de firmar; usarás tu DNIe y tu PIN.'}</span></span></li></ul>
      <div class="alert info"><span>${I('info')}</span><div class="t"><p>Usa el certificado a tu nombre. Si es de otra persona, la firma se rechaza.</p></div></div>
      <button class="btn primary lg block" ${st === 'doing' ? 'disabled' : ''}>${st === 'doing' ? 'Confirmando tu firma…' : 'Firmar con Firma Perú'}</button>
      <button class="btn danger block" data-act="dialog:reject">Rechazar y devolver</button>`;
  return `${head('Firmar', 'Firmar documento de gestión', `${typeChip(DOC.typeColor, DOC.type)}<span>·</span><span>${DOC.title}</span><span>·</span>${tag('Paso 1 de 4', 'info')}`, `${trackBtns(5, 4)}<button class="btn" data-act="screen:detail">${I('back')}Volver</button>`)}
  <div class="cols" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)">
    <div class="card"><div class="ctitle"><span>${DOC.title}</span><span class="seg"><button aria-pressed="true">Documento</button><button aria-pressed="false">Resolución</button></span></div>${pdfPage(DOC.title)}</div>
    <div class="stack"><div class="card"><div class="ctitle"><span>Tu firma</span></div>${panel}</div>
      <div class="card"><div class="ctitle"><span>Antes de ti</span></div><p class="hint">Eres la primera persona de la ruta: nadie firmó antes.</p></div></div></div>`;
}

function screenResubmit() {
  return `${head('Corregir y reenviar', 'Corregir y reenviar', `${typeChip(DOC.typeColor, DOC.type)}<span>·</span>${tag('Versión 2', 'info')}`, `${trackBtns(7, 4)}<button class="btn" data-act="screen:detail">${I('back')}Volver</button>`, 'Se crea la versión 2. La ruta empieza de cero y todas las oficinas vuelven a firmar.')}
  <div class="alert warn"><span>${I('alert')}</span><div class="t"><b>Por qué se devolvió · Oficina de Asesoría Jurídica</b><p>«El artículo 4 contradice la resolución adjunta; corregir y volver a enviar.»</p></div></div>
  <div class="cols"><div class="stack">
    <div class="card"><div class="ctitle"><span>Datos</span></div><div class="field"><label>Título del documento *</label><div class="input">PRUEBA 001</div></div></div>
    <div class="card"><div class="ctitle"><span>Archivos de la versión 2</span></div>
      <div class="file"><span class="fi">${I('file')}</span><div class="ft"><b>Documento de gestión corregido *</b><span class="hint">Obligatorio: sube el PDF corregido</span></div><button class="btn primary sm">${I('upload')}Elegir PDF</button></div>
      <div class="file"><span class="fi">${I('file')}</span><div class="ft"><b>Resolución que lo aprueba</b><span class="hint">PRUEBA 001 - Resolucion.pdf · se mantiene</span></div><span class="actions"><button class="switch" role="switch" aria-checked="true" aria-label="Mantener"></button><span class="hint">Mantener la actual</span></span></div></div></div>
    <div class="stack"><div class="card"><div class="ctitle"><span>Qué va a pasar</span></div><ul class="check"><li><span class="ci now">1</span><span class="ct"><b>Se crea la versión 2</b><span class="hint">La versión 1 queda archivada.</span></span></li><li><span class="ci wait">2</span><span class="ct"><b>La ruta empieza de cero</b><span class="hint">Core designa a las personas de hoy, no las de la versión 1.</span></span></li><li><span class="ci wait">3</span><span class="ct"><b>Se avisa a la oficina de origen</b><span class="hint">Es la primera en firmar.</span></span></li></ul></div></div></div>
  <div class="sticky"><span class="hint">No se puede deshacer una vez enviado.</span><span class="actions"><button class="btn">Cancelar</button><button class="btn primary">Enviar versión 2 a firma</button></span></div>`;
}

function screenSettings() {
  const seg = (a, b, on) => `<span class="seg"><button aria-pressed="${on === 0}">${a}</button><button aria-pressed="${on === 1}">${b}</button></span>`;
  const rule = (t, h, inner) => `<div class="card"><div><h3>${t}</h3><p class="hint">${h}</p></div>${inner}</div>`;
  const sw = (t, h, on) => `<div class="file" style="border:0;padding:.4rem 0"><div class="ft"><b>${t}</b><span class="hint">${h}</span></div><button class="switch" role="switch" aria-checked="${on}" aria-label="${t}"></button></div>`;
  return `${head('Visibilidad', 'Visibilidad de documentos', `${tag('Solo administradores', 'neutral')}`, `<button class="track" data-act="drawer:log">${I('hist')}Registro de cambios <span class="n">3</span></button>`, 'Qué ve cada oficina de la ruta cuando un documento circula o es devuelto. Aplica a todos los documentos, nuevos y en curso.')}
  <div class="cols"><div class="stack">
    ${rule('Oficinas que aún no les toca', 'Por ejemplo, Presidencia mientras el documento está en Asesoría Jurídica.', seg('Pueden ver los PDF', 'Solo el estado, sin PDF', 0))}
    ${rule('Versiones para oficinas que ya firmaron', 'Cuando el documento se devuelve y hay una versión nueva.', seg('Solo la que firmaron', 'Todas las versiones', 0))}
    ${rule('Motivo de la devolución', 'Quién puede leer lo que escribió quien devolvió.', seg('Origen y quien devolvió', 'Toda la ruta', 0))}
    <div class="card"><div><h3>Avisos por correo</h3><p class="hint">Al buzón institucional de la persona. Fuera de producción todo llega al buzón de prueba.</p></div>${sw('Le toca firmar', 'A la persona designada de la oficina a la que llega el turno.', true)}${sw('Documento devuelto', 'A quien lo envió, con el motivo.', true)}${sw('Documento firmado por todas', 'A quien lo envió, con el código de verificación.', true)}${sw('Documento anulado', 'A quienes ya habían firmado.', false)}</div></div>
    <div class="stack"><div class="card" style="position:sticky;top:.5rem"><div class="ctitle"><span>${I('eye')} Así lo vería una oficina sin turno</span></div><p class="hint">Por ejemplo, Presidencia. Se actualiza al elegir.</p><div class="alert info"><div class="t"><p>El documento no llegó a su turno. Ve su estado y que fue devuelto; puede consultar los PDF y no ve el motivo.</p></div></div></div></div></div>
  <div class="sticky"><span class="hint">Hay cambios sin guardar.</span><span class="actions"><button class="btn">Descartar</button><button class="btn primary">Guardar cambios</button></span></div>`;
}


/* ---------- flujo ---------- */
function screenFlow() {
  const step = (n, t, who, what, links, kind = '') => `<div class="card" style="${kind === 'bad' ? 'border-color:var(--warn-border)' : kind === 'ok' ? 'border-color:var(--ok-border)' : ''}"><div class="ctitle"><span style="display:flex;gap:.6rem;align-items:center"><span class="num" style="width:1.75rem;height:1.75rem;border-radius:50%;background:var(--p-highlight-background);color:var(--p-highlight-color);display:grid;place-items:center;font-size:.8rem;font-weight:700">${n}</span>${t}</span>${tag(who, 'neutral')}</div><p class="hint">${what}</p><div class="actions">${links.map(([l, s, st]) => `<button class="btn sm" data-act="go:${s}:${st || ''}">${l}</button>`).join('')}</div></div>`;
  const rowx = (a, b, c, d) => `<tr><td>${a}</td><td>${b}</td><td><b>${c}</b></td><td>${d}</td></tr>`;
  return `<div class="head"><div><h1>Flujo de un documento de gestión</h1><p class="lead">El recorrido completo de punta a punta. Cada paso lleva a su pantalla de esta maqueta; en cada estado hay una sola acción principal.</p></div></div>
  <div class="cols" style="grid-template-columns:repeat(2,minmax(0,1fr))">
    ${step(1, 'Crear el borrador', 'Solicitante', 'Elige tipo (y subtipo), escribe el título y sube el documento y la resolución. Se guarda como borrador: aún no se avisa a nadie.', [['Nuevo documento', 'form', 'create']])}
    ${step(2, 'Revisar y corregir', 'Solicitante', 'En el detalle comprueba la ruta (quién firma en cada oficina) y los archivos. Puede reemplazar los PDF o corregir los datos las veces que quiera.', [['Detalle · Borrador', 'detail', 'draft'], ['Corregir', 'form', 'edit']])}
    ${step(3, 'Enviar a firma', 'Solicitante', 'Una confirmación dice a quién llega primero y que no se podrá corregir. Desde aquí el documento queda congelado.', [['Confirmación de envío', 'detail', 'draft:send']])}
    ${step(4, 'Cada oficina firma, en orden', 'Oficinas', 'A quien le toca le llega un correo y lo ve en «Por firmar». Revisa el PDF, comprueba su equipo y firma con su DNIe.', [['Por firmar', 'list', 'sign'], ['Firmar', 'sign', 'turn'], ['Detalle · En firma', 'detail', 'sent']])}
    ${step('5a', 'Firman todas → Firmado', 'Sistema', 'El solicitante recibe el aviso con el código de verificación. Puede descargar el documento firmado y cualquiera puede verificarlo.', [['Detalle · Firmado', 'detail', 'signed']], 'ok')}
    ${step('5b', 'Una oficina devuelve', 'Oficina', 'Escribe el motivo y el documento vuelve a la oficina de origen. Lo ya firmado queda archivado en la versión anterior.', [['Rechazar y devolver', 'sign', 'turn:reject'], ['Detalle · Devuelto', 'detail', 'returned']], 'bad')}
    ${step(6, 'Corregir y reenviar', 'Solicitante', 'Ve el motivo, sube el documento corregido y envía la versión 2. La ruta empieza de cero y se vuelve al paso 4.', [['Corregir y reenviar', 'resubmit', 'one']])}
    ${step(7, 'Anular', 'Solicitante', 'Desde «En firma» o «Devuelto», con motivo y confirmación. No se puede reabrir; las firmas hechas quedan archivadas.', [['Confirmación de anulación', 'detail', 'sent:cancel'], ['Detalle · Anulado', 'detail', 'cancelled']])}
  </div>
  <div class="card"><div class="ctitle"><span>Acción principal por estado</span></div><div class="table"><table><thead><tr><th>Estado</th><th>Quién actúa</th><th>Acción principal</th><th>Otras (en «⋯»)</th></tr></thead><tbody>
    ${rowx('Borrador', 'Solicitante', 'Enviar a firma', 'Corregir datos y archivos · Eliminar borrador')}
    ${rowx('En firma', 'La oficina a la que le toca', 'Firmar (solo a quien le toca)', 'Anular documento (solicitante)')}
    ${rowx('Devuelto', 'Solicitante', 'Corregir y reenviar', 'Anular documento')}
    ${rowx('Firmado', 'Cualquiera de la ruta', 'Descargar firmado', 'Verificar en la página pública')}
    ${rowx('Anulado', '—', '(ninguna)', 'Solo consulta')}
  </tbody></table></div></div>
  <div class="card"><div class="ctitle"><span>Administración</span></div><p class="hint">Fuera del recorrido de cada documento, el administrador define qué ve cada oficina y qué avisos se envían.</p><div class="actions"><button class="btn sm" data-act="go:settings:one">Visibilidad de documentos</button></div></div>`;
}

/* ---------- auditoría ---------- */
function screenAudit() {
  const row = (a, b, c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
  return `<div class="head"><div><h1>Auditoría del módulo</h1><p class="lead">Lo que quedó del modelo anterior («directiva») y los problemas de uso encontrados, pantalla por pantalla. Lo de la derecha es lo que proponen las pestañas de esta maqueta.</p></div></div>
  <div class="card"><div class="ctitle"><span>1. Palabras que no son del nuevo modelo</span></div><p class="hint">El modelo es «documento de gestión»; «Directivas» es solo uno de sus tipos (con Reglamentos, Políticas, Planes, Manuales y Documentos de gestión institucional).</p>
  <div class="table"><table><thead><tr><th>Dónde</th><th>Hoy dice</th><th>Propuesta</th></tr></thead><tbody>
  ${row('Lista, formulario, encabezados', '«Documentos de gestión», «Nuevo documento» ✔', 'Se mantiene')}
  ${row('Detalle · botones y diálogo', 'Anular directiva · Volver a las directivas', 'Anular documento · Volver a los documentos')}
  ${row('Detalle · archivos', '«Directiva» / «Resolución» (botón por versión)', 'Documento de gestión / Resolución que lo aprueba')}
  ${row('Detalle · mensajes', '«La ruta de esta directiva queda registrada…»', '«La ruta de este documento…»')}
  ${row('Firmar', 'Firmar directiva · Directiva devuelta · Rechazar directiva · «Esta directiva no espera tu firma»', 'Firmar documento · Documento devuelto · Rechazar documento')}
  ${row('Reenviar', '«Título de la directiva» · «Directiva corregida (PDF)» · caption «Directiva · oficina»', '«Título del documento» · «Documento de gestión corregido (PDF)» · tipo y oficina reales')}
  ${row('Visibilidad (admin)', 'Visibilidad de directivas · «Administración · Directivas»', 'Visibilidad de documentos (como en el menú)')}
  ${row('Seguimiento (eventos)', 'Envió la directiva a firma · Devolvió la directiva · Se anuló la directiva · La directiva venció…', 'Envió el documento a firma · Devolvió el documento · Se anuló el documento…')}
  ${row('Correos y avisos (API)', 'Asuntos y textos con «directiva»', 'Se revisan en el API con el mismo criterio; «Directiva» solo si el tipo lo es')}
  ${row('Dirección web', '/directivas, /directivas/:id/firmar…', '/documentos-de-gestion (con redirección de la anterior)')}
  </tbody></table></div></div>
  <div class="card"><div class="ctitle"><span>2. Problemas de uso</span></div><ul style="margin:0;padding-left:1.1rem;display:grid;gap:.4rem" class="hint">
    <li><b style="color:var(--p-text-color)">Lista:</b> tres filas de filtros (estado, tipo, subtipo) ocupan la pantalla antes de ver un solo documento; no hay búsqueda; no se ve el avance ni a quién le toca.</li>
    <li><b style="color:var(--p-text-color)">Nuevo documento:</b> el formulario no tiene orden (origen, tipo, subtipo, título, calidad, archivos mezclados); no se sabe si la ruta está lista sin abrir el cajón; la acción principal queda al final de una página larga.</li>
    <li><b style="color:var(--p-text-color)">Detalle:</b> el estado y «quién tiene el turno» no están a la vista; seis botones del mismo peso en la cabecera (Volver, Firmar, Corregir, Eliminar…); lo técnico (huella SHA-256) se muestra como contenido principal.</li>
    <li><b style="color:var(--p-text-color)">Firmar:</b> las advertencias del navegador y del certificado salen como mensajes sueltos; no se ve qué falta para poder firmar ni qué pasa después.</li>
    <li><b style="color:var(--p-text-color)">Reenviar:</b> el motivo de la devolución es un mensaje más entre otros; no se explica lo que ocurrirá al enviar (versión 2, ruta de cero, a quién se avisa).</li>
    <li><b style="color:var(--p-text-color)">Visibilidad:</b> reglas y avisos sin agrupar; la vista previa queda lejos de lo que se está cambiando.</li>
    <li><b style="color:var(--p-text-color)">Concordancia:</b> columnas «Actualizada» (femenino) para documentos; botón «Abrir» repetido en cada fila.</li></ul></div>
  <div class="card"><div class="ctitle"><span>3. Reglas que se aplican en todas las pantallas</span></div><ul style="margin:0;padding-left:1.1rem;display:grid;gap:.4rem" class="hint">
    <li>Cabecera igual: migas de pan, título, tipo · estado · versión · oficina, y acciones: <b style="color:var(--p-text-color)">Seguimiento</b> y <b style="color:var(--p-text-color)">Ruta de firmas</b> (cajones), <b style="color:var(--p-text-color)">una</b> acción principal y el resto en «⋯».</li>
    <li>Un solo color para lo que requiere acción (primario), verde = hecho, ámbar = atención, rojo = destructivo.</li>
    <li>Estados con palabras de persona: «Le toca a…», «Espera su turno», «Devuelto por…», no códigos.</li>
    <li>Acciones irreversibles siempre con confirmación que dice qué se pierde y qué se avisa.</li>
    <li>Móvil: tarjetas en vez de tabla, botones a todo el ancho, acciones principales al alcance del pulgar.</li></ul></div>`;
}

/* ---------- cajones y diálogos ---------- */
function drawers() {
  const tl = `<ol class="tl">${EVENTS.map((e) => `<li><b>${e[0]}</b>${(e[2] || []).map((c) => `<div class="diff"><span class="hint">${c[0]}</span><s>${c[1]}</s><span>→ ${c[2]}</span></div>`).join('')}<small>${e[1]}</small></li>`).join('')}</ol>`;
  const route = `<ol class="tl">${ROUTE.map((r, i) => `<li><b>${r.off}</b><span>${r.who}</span><small>${r.role}</small><small>${i === 0 ? tag('Le toca', 'info') : tag('Espera su turno', 'neutral')}</small></li>`).join('')}</ol>`;
  const log = `<ol class="tl"><li><b>Documentos para oficinas sin turno</b><span>Pueden ver los PDF → Solo el estado</span><small>Admin · 11/11/2026 09:30</small></li><li><b>Aviso: le toca firmar</b><span>Apagado → Encendido</span><small>Admin · 10/11/2026 17:02</small></li></ol>`;
  const d = (id, t, inner) => `<aside class="drawer ${S.drawer === id ? 'on' : ''}" role="dialog" aria-label="${t}"><div class="dhead"><h3>${t}</h3><button class="close" data-act="drawer:" aria-label="Cerrar">✕</button></div><div class="dbody">${inner}</div></aside>`;
  const dlgs = {
    send: ['Enviar a firma', 'Se enviará el documento con su resolución a 4 oficinas, en orden. Después de enviarlo ya no se puede corregir.', 'Primero firma Oficina de origen (Yamil Alberto Peña Loayza); se le avisará por correo.', 'Enviar a firma', 'primary'],
    cancel: ['Anular documento', 'Se cancela la solicitud en el firmador. No se puede reabrir ni reenviar. Las firmas ya hechas quedan archivadas.', null, 'Anular documento', 'danger', true],
    reject: ['Rechazar y devolver', 'Vuelve a la oficina de origen con tu motivo. Tendrá que corregirlo y enviarlo de nuevo; la ruta empieza de cero.', null, 'Devolver documento', 'danger', true],
    filters: ['Filtros', null, null, 'Aplicar', 'primary', false, true],
  };
  let dialog = '';
  if (S.dialog) {
    const [t, p, p2, ok, k, reason, filt] = dlgs[S.dialog];
    dialog = `<div class="dialog on" role="dialog" aria-modal="true" aria-label="${t}"><div class="ctitle"><h3>${t}</h3><button class="close" data-act="dialog:" aria-label="Cerrar">✕</button></div>
    ${filt ? `<div class="field"><span class="label">Estado</span><div class="pills"><button class="pill" aria-pressed="true">En firma</button><button class="pill" aria-pressed="false">Borrador</button><button class="pill" aria-pressed="false">Devuelto</button><button class="pill" aria-pressed="false">Firmado</button><button class="pill" aria-pressed="false">Anulado</button></div></div><div class="field"><span class="label">Tipo</span><div class="pills"><button class="pill" aria-pressed="true">Directivas</button><button class="pill" aria-pressed="false">Reglamentos</button><button class="pill" aria-pressed="false">Políticas</button><button class="pill" aria-pressed="false">Planes</button><button class="pill" aria-pressed="false">Manuales</button><button class="pill" aria-pressed="false">Gestión institucional</button></div></div>` : `<p class="hint">${p}</p>${p2 ? `<div class="alert info"><div class="t"><p>${p2}</p></div></div>` : ''}${reason ? `<div class="field"><label>Motivo *</label><div class="input area ph">Escribe al menos 10 letras…</div><span class="hint" style="text-align:right">0 / 500</span></div><label class="hint" style="display:flex;gap:.5rem;align-items:center"><input type="checkbox"> Entiendo que esto no se puede deshacer.</label>` : ''}`}
    <div class="actions" style="justify-content:flex-end"><button class="btn" data-act="dialog:">Cancelar</button><button class="btn ${k}" ${reason ? 'disabled' : ''}>${ok}</button></div></div>`;
  }
  return `<div class="veil ${S.drawer || S.dialog ? 'on' : ''}" data-act="${S.drawer ? 'drawer:' : 'dialog:'}"></div>${d('track', 'Seguimiento', tl)}${d('route', 'Ruta de firmas', route)}${d('log', 'Registro de cambios', log)}${dialog}`;
}

/* ---------- notas por pantalla ---------- */
const NOTES = {
  flow: ['Siete pasos, tres personas (solicitante, oficinas, administrador) y dos finales posibles: firmado o devuelto.', 'Cada estado tiene UNA acción principal en la cabecera; el resto va en «⋯». Quien no puede actuar no ve el botón en vez de verlo apagado.', 'Pulsa los botones de cada paso para saltar a su pantalla y estado.'],
  list: ['Una sola barra: pestañas por rol (Mis documentos · Por firmar · En tu ruta) con el número de pendientes, búsqueda y un botón «Filtros» que abre estado, tipo y subtipo juntos. Lo aplicado se ve como etiquetas que se quitan con ×.', 'Cada fila dice lo que importa: título, tipo (con su color), páginas y versión; estado con barra de avance (2 de 4) y «Le toca a…». En «Por firmar» la acción es «Revisar y firmar», no «Abrir».', 'Toda la fila abre el documento. Se corrige «Actualizada» → «Actualizado». En móvil son tarjetas con el estado y el avance a la vista.', 'Vacía: explica qué subir y por qué, con un solo botón.'],
  form: ['Cuatro pasos numerados con una pregunta cada uno: Oficina de origen → Clasificación → Datos → Archivos. El subtipo aparece solo si el tipo lo pide y queda marcado con el resalte institucional.', 'Arriba, una franja dice si la ruta está lista («4 oficinas, todas con firmante») y abre el cajón de la ruta; si falta alguien, cambia a ámbar y dice a quién.', 'Archivos con zona para arrastrar, cuenta de páginas y total del expediente; el PDF cargado se ve como fila con «Cambiar».', 'Barra de acciones fija abajo: «Guardar borrador» siempre a la vista; aclara que aún no se envía a nadie.'],
  detail: ['Cabecera estándar: migas de pan, título, tipo · estado · versión · oficina. Los dos cajones (Seguimiento, Ruta) y UNA acción principal según el estado; lo demás en «⋯».', 'Un aviso de estado en lenguaje de persona: «Le toca firmar a…», «Asesoría Jurídica devolvió con observaciones» (con el motivo y botón), «Firmado por las 4 oficinas» (con código y descarga), «Anulado».', 'Avance de las firmas como pasos con nombre y estado (Firmó · Le toca · Espera); al pulsar uno se abre la ruta. En móvil pasa a vertical.', 'Documentos como filas con acciones propias; la huella SHA-256 queda en «Detalles técnicos». Resumen a un lado con los datos del documento.', 'Prueba cada estado arriba; abre «⋯» y los cajones; en Borrador pulsa «Enviar a firma» y en En firma «⋯ → Anular».'],
  sign: ['Dos columnas: el PDF grande a la izquierda (con selector Documento / Resolución) y el panel de firma a la derecha.', 'El panel es una lista de comprobación: turno ✔, navegador ✔, Firma Perú abierto… Así se sabe qué falta antes de pulsar. «Firmar con Firma Perú» es el único botón destacado; «Rechazar y devolver» es secundario y pide motivo.', 'Después de firmar: confirmación clara, a quién sigue, y «Ver el seguimiento».'],
  resubmit: ['El motivo de la devolución va primero y destacado, con quién lo escribió.', 'El archivo obligatorio (el documento corregido) se pide con acción clara; la resolución se mantiene con un interruptor.', '«Qué va a pasar» explica la versión 2, que la ruta empieza de cero y a quién se avisa, antes de enviar.'],
  settings: ['Reglas agrupadas por tema, cada una con su selector y un ejemplo; avisos por correo en una sola tarjeta con interruptores y su descripción.', 'La vista previa («Así lo vería una oficina sin turno») queda fija a un lado mientras se cambian las reglas.', 'Barra fija «Guardar cambios / Descartar» que dice cuándo hay cambios sin guardar. «Registro de cambios» es el mismo botón-cajón del resto del módulo.'],
};

/* ---------- render ---------- */
const root = document.getElementById('root');
function render() {
  document.documentElement.classList.toggle('app-dark', S.theme === 'dark');
  const widths = { d: '1100px', t: '768px', m: '375px' };
  const states = STATES[S.screen] || [];
  const screens = { audit: screenAudit, flow: screenFlow, list: screenList, form: screenForm, detail: screenDetail, sign: screenSign, resubmit: screenResubmit, settings: screenSettings };
  const body = screens[S.screen]();
  const frame = S.screen === 'audit'
    ? `<div class="vp" style="max-width:1100px"><div class="app">${body}</div></div>`
    : `<div class="vp ${S.size === 'm' ? 'm' : S.size === 't' ? 't' : ''}" style="max-width:${widths[S.size]}"><div class="app">${body}</div>${drawers()}</div>`;
  const notes = NOTES[S.screen] ? `<div class="card0"><h2>Qué cambia en esta pantalla</h2><div class="notes"><ul>${NOTES[S.screen].map((n) => `<li>${n}</li>`).join('')}</ul></div></div>` : '';
  root.innerHTML = `<div class="bar"><strong>Rediseño · Documentos de gestión</strong>
    <div class="grp"><span>Pantalla</span>${SCREENS.map(([k, l]) => `<button class="chip" aria-pressed="${S.screen === k}" data-act="screen:${k}">${l}</button>`).join('')}</div>
    ${states.length > 1 ? `<div class="grp"><span>Estado</span>${states.map(([k, l]) => `<button class="chip" aria-pressed="${cur() === k}" data-act="state:${k}">${l}</button>`).join('')}</div>` : ''}
    <div class="grp"><span>Tema</span><button class="chip" aria-pressed="${S.theme === 'light'}" data-act="theme:light">Claro</button><button class="chip" aria-pressed="${S.theme === 'dark'}" data-act="theme:dark">Oscuro</button></div>
    ${S.screen === 'audit' ? '' : `<div class="grp"><span>Tamaño</span><button class="chip" aria-pressed="${S.size === 'd'}" data-act="size:d">Escritorio</button><button class="chip" aria-pressed="${S.size === 't'}" data-act="size:t">Tableta</button><button class="chip" aria-pressed="${S.size === 'm'}" data-act="size:m">Móvil</button></div>`}</div>
  <main class="shell"><div class="card0"><h2>${SCREENS.find((s) => s[0] === S.screen)[1]}${S.screen === 'audit' ? '' : ` <span class="tag0 good">propuesta</span>`}</h2><div class="stage">${frame}</div></div>${notes}</main>`;
}
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) { if (S.menu) { S.menu = false; render(); } return; }
  const [a, v] = el.dataset.act.split(':');
  if (a === 'screen') { S.screen = v; S.drawer = null; S.dialog = null; S.menu = false; }
  else if (a === 'state') { S.state[S.screen] = v; S.drawer = null; S.dialog = null; S.menu = false; }
  else if (a === 'theme') S.theme = v;
  else if (a === 'size') { S.size = v; S.drawer = null; S.dialog = null; }
  else if (a === 'drawer') { S.drawer = v || null; S.menu = false; }
  else if (a === 'dialog') { S.dialog = v || null; S.menu = false; }
  else if (a === 'menu') S.menu = !S.menu;
  else if (a === 'sub') S.sub = v;
  else if (a === 'go') { const [, scr, st] = el.dataset.act.split(':'); const [stt, dlg] = (el.dataset.act.split(':')[3] ? [el.dataset.act.split(':')[2], el.dataset.act.split(':')[3]] : [st, null]); S.screen = scr; if (stt) S.state[scr] = stt; S.drawer = null; S.dialog = dlg || null; S.menu = false; window.scrollTo(0, 0); }
  render();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { S.drawer = null; S.dialog = null; S.menu = false; render(); } });
render();
