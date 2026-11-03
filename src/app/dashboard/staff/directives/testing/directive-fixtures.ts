import { ApiData } from '../../../../models/api/api-data.model';
import { DirectiveAccess, DirectiveDetail, DirectiveRoute, DirectiveSummary, RouteHolder } from '../../../../services/directives.service';

export const access: DirectiveAccess = {
  can_request: true, request_units: ['adm', 'adm_sub'], request_unit_names: { adm: 'Oficina de Administración', adm_sub: 'Unidad de Logística' }, can_sign: false, sign_units: [],
};

export function ok<T>(data: T): ApiData<T> {
  return { status: 'success', encoded: false, decoded: true, payload: { iat: 0, exp: 0, message: 'OK', title: 'OK', data, log: data, error: '' } };
}

export function holder(name: string, condition: RouteHolder['condition'] = 'titular'): RouteHolder {
  return { person_id: 1, full_name: name, document_type: 'dni', document_number: '40000001', position: null, condition, title: 'Jefe de la Oficina', starts_at: null, expires_at: null, note: 'Resolución 014-2026' };
}

export function route(overrides: Partial<DirectiveRoute> = {}): DirectiveRoute {
  return {
    steps: [
      { key: 'origin', label: 'Oficina de origen', unit: 'adm', skipped: false, holder: holder('Ana Torres'), next: null },
      { key: 'quality', label: 'Oficina de Gestión de la Calidad', unit: 'ogc', skipped: true, holder: null, next: null },
      { key: 'legal', label: 'Oficina de Asesoría Jurídica', unit: 'oaj', skipped: false, holder: holder('Carlos Paucar', 'encargado'), next: null },
      { key: 'modernization', label: 'Unidad de Modernización', unit: 'upme', skipped: false, holder: null, next: null },
      { key: 'presidency', label: 'Presidencia', unit: 'pco', skipped: false, holder: holder('Rosa Quispe'), next: null },
    ],
    can_send: false,
    issues: [{ step: 'modernization', unit: 'upme', reason: 'no_holder' }],
    ...overrides,
  };
}

export function summary(overrides: Partial<DirectiveSummary> = {}): DirectiveSummary {
  return {
    id: 7, title: 'Directiva para el control de bienes patrimoniales', origin: { code: 'adm', name: 'Oficina de Administración' }, is_quality: false, status: 'draft', status_label: 'Borrador',
    version: 1, created_by: { id: 5, nick: 'ana' }, created_at: '2026-11-03T10:00:00Z', updated_at: '2026-11-03T10:00:00Z', can_edit: true,
    files: { directive: { name: 'directiva.pdf', size: 1800000, pages: 14 }, resolution: { name: 'resolucion.pdf', size: 600000, pages: 3 } }, ...overrides,
  };
}

export function detail(overrides: Partial<DirectiveDetail> = {}): DirectiveDetail {
  return {
    ...summary(), sha256: { directive: 'a'.repeat(64), resolution: 'b'.repeat(64) },
    events: [{ type: 'created', version: 1, at: '2026-11-03T10:00:00Z', by: { id: 5, nick: 'ana' }, data: {} }],
    files_visible: true, versions: [], returned: null, viewer: 'origin', can_reject: false, can_resubmit: false, can_cancel: false, cancelled: null,
    progress: [], can_sign: false, active_office: null, ...overrides,
  };
}
