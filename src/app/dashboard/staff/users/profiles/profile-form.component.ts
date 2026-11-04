import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PanelMenuModule } from 'primeng/panelmenu';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { MODULE_LABELS, PermissionOption, ProfileInput, ProfileItem, ProfilesService, profileError } from '../../../../services/profiles.service';

/**
 * Crear, editar o ver un perfil. Ver es para los del sistema y los retirados (solo lectura). Al cambiar los permisos de un perfil con personas, el API pide
 * confirmar y aquí se dice a cuántas afecta antes de reenviar. Maqueta: docs/design/perfiles-mock (vistas 2 y 3).
 */
@Component({
  selector: 'app-profile-form',
  imports: [FormsModule, ButtonModule, CheckboxModule, DialogModule, InputTextModule, MessageModule, PanelMenuModule, SelectButtonModule, SkeletonModule, TextareaModule],
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

  /** Los módulos en que quien pide puede dar permisos, en el orden en que llegan. */
  readonly groups = computed(() => Object.entries(this.options()).map(([module, items]) => ({ module, label: MODULE_LABELS[module] ?? module, items })));
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
        this.refreshPreview(0);
      },
      error: error => {
        this.error.set(profileError(error).message);
        this.loading.set(false);
      },
    });
  }

  isSelected(code: string): boolean {
    return this.selected().includes(code);
  }

  toggle(code: string, checked: boolean): void {
    this.selected.update(list => (checked ? [...new Set([...list, code])] : list.filter(item => item !== code)));
    this.refreshPreview();
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
