import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PanelModule } from 'primeng/panel';
import { PanelMenuModule } from 'primeng/panelmenu';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { StatusTagComponent } from '../../../../core/components/status-tag.component';
import { MODULE_LABELS, PermissionOption, ProfileInput, ProfileItem, ProfilesService, profileError } from '../../../../services/profiles.service';

/** Un módulo del formulario: el permiso de todo el módulo (si lo tiene) y las demás filas, una por pantalla o permiso. */
export interface PermissionModule {
  module: string;
  label: string;
  umbrella: PermissionOption | null;
  rows: PermissionOption[];
}

export type ModuleState = 'none' | 'some' | 'all';

/** Pantallas que solo se marcan a mano: «Todo el módulo» no las incluye. */
const SENSITIVE = ['accounting.settings'];

/** Pantallas cuyos datos los sirve el sistema antiguo: su permiso solo oculta la pantalla. */
const HIDE_ONLY = ['student_card.ranking', 'student_card.average'];

/**
 * Crear, editar o ver un perfil. Ver es para los del sistema y los retirados (solo lectura). Al cambiar los permisos de un perfil con personas, el API pide
 * confirmar y aquí se dice a cuántas afecta antes de reenviar. Maqueta: docs/design/perfiles-mock (vistas 2 y 3).
 */
@Component({
  selector: 'app-profile-form',
  imports: [FormsModule, ButtonModule, CheckboxModule, DialogModule, InputTextModule, MessageModule, PanelModule, PanelMenuModule, SelectButtonModule, SkeletonModule, TextareaModule, StatusTagComponent],
  templateUrl: './profile-form.component.html',
  styleUrl: './profile-form.component.css',
})
export class ProfileFormComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly profile = signal<ProfileItem | null>(null);
  readonly options = signal<Record<string, PermissionOption[]>>({});
  readonly selected = signal<string[]>([]);
  readonly confirmPeople = signal<number | null>(null);

  /** El menú que abrirían los permisos marcados (solo los de este perfil). `null` mientras no se ha pedido o si no se pudo pedir. */
  readonly previewMenu = signal<MenuItem[] | null>(null);
  readonly previewFailed = signal(false);
  private previewTimer: ReturnType<typeof setTimeout> | null = null;
  private previewRequest = 0;

  name = '';
  description = '';
  module = 'other';
  code: string | null = null;

  /** Los módulos abiertos: al cargar, los que ya tienen algo marcado; la persona abre o cierra el resto. */
  private readonly opened = signal<Set<string>>(new Set());

  /** Los módulos en que quien pide puede dar permisos, en el orden en que llegan, cada uno con su permiso de módulo completo (si tiene) y sus filas. */
  readonly groups = computed<PermissionModule[]>(() => Object.entries(this.options()).map(([module, items]) => {
    const umbrella = items.find(item => (item.includes ?? []).length > 0) ?? null;

    return { module, label: MODULE_LABELS[module] ?? module, umbrella, rows: items.filter(item => item !== umbrella).sort((a, b) => Number(this.sensitive(a.code)) - Number(this.sensitive(b.code))) };
  }));
  readonly moduleOptions = computed(() => [...Object.keys(this.options()), 'other'].map(value => ({ label: MODULE_LABELS[value] ?? value, value })));
  readonly readOnly = computed(() => this.code !== null && !(this.profile()?.can_edit ?? false));

  constructor(private service: ProfilesService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code');

    this.service.list().subscribe({
      next: response => {
        this.options.set(response.payload.data?.permissions ?? {});
        const profile = this.code ? (response.payload.data?.profiles ?? []).find(item => item.code === this.code) ?? null : null;

        if (this.code && !profile) {
          this.error.set('No encontramos ese perfil.');
        } else if (profile) {
          this.profile.set(profile);
          this.name = profile.name;
          this.description = profile.description ?? '';
          this.module = profile.module;
          this.selected.set([...profile.permissions]);
        }
        this.loading.set(false);
        this.opened.set(new Set(this.groups().filter(group => this.moduleCount(group) > 0).map(group => group.module)));
        this.refreshPreview(0);
      },
      error: error => {
        this.error.set(profileError(error).message);
        this.loading.set(false);
      },
    });
  }

  /** Está marcado si se eligió solo o lo incluye el permiso de su módulo completo. */
  isSelected(code: string): boolean {
    const list = this.selected();

    return list.includes(code) || this.groups().some(group => group.umbrella !== null && list.includes(group.umbrella.code) && (group.umbrella.includes ?? []).includes(code));
  }

  toggle(code: string, checked: boolean): void {
    this.selected.update(list => {
      if (checked) {
        return [...new Set([...list, code])];
      }

      // Si lo cubre el permiso del módulo completo, ese se cambia por las demás pantallas que se quedan.
      const covering = this.groups().find(group => group.umbrella !== null && list.includes(group.umbrella.code) && (group.umbrella.includes ?? []).includes(code));

      if (covering?.umbrella) {
        const stay = (covering.umbrella.includes ?? []).filter(item => item !== code);

        return [...new Set([...list.filter(item => item !== covering.umbrella!.code), ...stay])];
      }

      return list.filter(item => item !== code);
    });
    this.refreshPreview();
  }

  /** «Todo el módulo»: marca el permiso del módulo (y quita las pantallas sueltas que ya cubre) o desmarca todo lo del módulo. Las pantallas sensibles se marcan a mano. */
  toggleModule(group: PermissionModule, checked: boolean): void {
    if (group.umbrella === null) {
      return;
    }

    const covered = group.umbrella.includes ?? [];
    const own = [group.umbrella.code, ...group.rows.map(row => row.code)];

    this.selected.update(list => (checked
      ? [...new Set([...list.filter(item => !covered.includes(item)), group.umbrella!.code])]
      : list.filter(item => !own.includes(item))));
    this.refreshPreview();
  }

  moduleCount(group: PermissionModule): number {
    return group.rows.filter(row => this.isSelected(row.code)).length;
  }

  moduleState(group: PermissionModule): ModuleState {
    if (group.umbrella !== null && this.selected().includes(group.umbrella.code)) {
      return 'all';
    }

    return this.moduleCount(group) > 0 ? 'some' : 'none';
  }

  isOpen(module: string): boolean {
    return this.opened().has(module);
  }

  setOpen(module: string, open: boolean): void {
    this.opened.update(current => {
      const next = new Set(current);
      open ? next.add(module) : next.delete(module);

      return next;
    });
  }

  /** Dentro de su módulo la fila no repite el nombre del módulo: «Contabilidad: incidencias del banco» se ve «Incidencias del banco». */
  rowLabel(option: PermissionOption): string {
    const index = option.label.indexOf(': ');
    const text = index >= 0 ? option.label.slice(index + 2) : option.label;

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  sensitive(code: string): boolean {
    return SENSITIVE.includes(code);
  }

  hideOnly(code: string): boolean {
    return HIDE_ONLY.includes(code);
  }

  /** Pide el menú de los permisos marcados esperando un momento por si se marcan varios seguidos; una respuesta vieja no pisa a una nueva. */
  refreshPreview(delay = 250): void {
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
    }

    this.previewTimer = setTimeout(() => {
      const request = ++this.previewRequest;
      this.service.previewMenu(this.selected()).subscribe({
        next: response => {
          if (request !== this.previewRequest) {
            return;
          }
          this.previewFailed.set(false);
          this.previewMenu.set((response.payload.data ?? []).map(group => ({ label: group.label, expanded: true, items: group.items.map(item => ({ label: item.label })) })));
        },
        error: () => {
          if (request === this.previewRequest) {
            this.previewFailed.set(true);
          }
        },
      });
    }, delay);
  }

  /** El código se arma del nombre al crear (el servidor lo confirma) y no cambia después. */
  get previewCode(): string {
    if (this.code) {
      return this.code;
    }
    const slug = this.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    return slug ? `custom_${slug}` : '';
  }

  get canSave(): boolean {
    return !this.readOnly() && !this.saving() && this.name.trim().length >= 3 && this.selected().length > 0;
  }

  save(confirmed = false): void {
    if (!this.canSave) {
      return;
    }

    const input: ProfileInput = { name: this.name.trim(), description: this.description.trim() || null, module: this.module, permissions: this.selected(), confirmed };
    this.saving.set(true);
    this.error.set(null);
    const request = this.code ? this.service.update(this.code, input) : this.service.create(input);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigateByUrl(`/${PATHS.profiles.list.link}`);
      },
      error: failure => {
        const detail = profileError(failure);
        this.saving.set(false);

        if (detail.reason === 'needs_confirmation') {
          this.confirmPeople.set(detail.people ?? 0);

          return;
        }
        this.error.set(detail.message);
      },
    });
  }

  confirmChange(): void {
    this.confirmPeople.set(null);
    this.save(true);
  }

  cancel(): void {
    this.router.navigateByUrl(`/${PATHS.profiles.list.link}`);
  }
}
