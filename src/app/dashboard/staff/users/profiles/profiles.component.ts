import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { StatusTagComponent } from '../../../../core/components/status-tag.component';
import { MODULE_LABELS, ProfileDetail, ProfileItem, ProfilesService, profileError } from '../../../../services/profiles.service';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/** El motivo para retirar un perfil: al menos 10 caracteres, como lo exige el API. */
export const MIN_RETIRE_REASON = 10;

const CORE_STATUS: Record<string, { label: string; severity: Severity }> = {
  pending: { label: 'Pendiente', severity: 'warn' },
  active: { label: 'Activo', severity: 'success' },
  inactive: { label: 'Inactivo', severity: 'secondary' },
  retired: { label: 'Retirado', severity: 'danger' },
};

/**
 * Perfiles: lista con búsqueda y filtros, y el retiro con aviso. El administrador ve todos; Recursos humanos solo los suyos de Asistencia (lo decide el API).
 * Maqueta: docs/design/perfiles-mock.
 */
@Component({
  selector: 'app-profiles',
  imports: [FormsModule, ButtonModule, DialogModule, IconFieldModule, InputIconModule, InputTextModule, MessageModule, SelectButtonModule, SkeletonModule, TableModule, TextareaModule, AppLucideIconComponent, StatusTagComponent],
  templateUrl: './profiles.component.html',
  styleUrl: './profiles.component.css',
})
export class ProfilesComponent implements OnInit {
  readonly profiles = signal<ProfileItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  /** Solo el administrador publica a Core: el API lo avisa en la lista. */
  readonly canPublish = signal(false);
  readonly skeletonRows = Array.from({ length: 4 }, (_, index) => index);

  readonly query = signal('');
  readonly moduleFilter = signal('all');
  readonly originFilter = signal('all');

  readonly minReason = MIN_RETIRE_REASON;

  readonly originOptions = [{ label: 'Todos', value: 'all' }, { label: 'Del sistema', value: 'system' }, { label: 'Propios', value: 'custom' }];

  /** Los módulos que tienen algún perfil, para no ofrecer filtros vacíos. */
  readonly moduleOptions = computed(() => {
    const modules = [...new Set(this.profiles().map(profile => profile.module))];

    return [{ label: 'Todos', value: 'all' }, ...modules.map(value => ({ label: MODULE_LABELS[value] ?? value, value }))];
  });

  readonly visible = computed(() => {
    const query = this.query().trim().toLowerCase();

    return this.profiles().filter(profile =>
      (this.moduleFilter() === 'all' || profile.module === this.moduleFilter())
      && (this.originFilter() === 'all' || profile.origin === this.originFilter())
      && (query === '' || profile.name.toLowerCase().includes(query) || profile.code.toLowerCase().includes(query)));
  });

  /** Diálogo de retiro. */
  readonly retiring = signal<ProfileItem | null>(null);
  readonly retireDetail = signal<ProfileDetail | null>(null);
  readonly retireLoading = signal(false);
  readonly retireSaving = signal(false);
  readonly retireError = signal<string | null>(null);
  reason = '';

  constructor(private service: ProfilesService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.list().subscribe({
      next: response => {
        this.profiles.set(response.payload.data?.profiles ?? []);
        this.canPublish.set(response.payload.data?.can_publish === true);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  moduleLabel(module: string): string {
    return MODULE_LABELS[module] ?? module;
  }

  originLabel(profile: ProfileItem): string {
    return profile.origin === 'system' ? 'Del sistema' : 'Propio';
  }

  originSeverity(profile: ProfileItem): Severity {
    return profile.origin === 'system' ? 'secondary' : 'info';
  }

  /** Lo que se dice de un perfil en Core: retirado aquí manda; sin respuesta de Core, «Sin publicar». */
  coreTag(profile: ProfileItem): { label: string; severity: Severity } {
    if (profile.retired) {
      return CORE_STATUS['retired'];
    }

    return (profile.core_status && CORE_STATUS[profile.core_status]) || { label: 'Sin publicar', severity: 'secondary' };
  }

  openCore(): void {
    this.router.navigateByUrl(`/${PATHS.userAdmin.profilesCore.link}`);
  }

  create(): void {
    this.router.navigateByUrl(`/${PATHS.profiles.create.link}`);
  }

  open(profile: ProfileItem): void {
    this.router.navigateByUrl(`/${PATHS.profiles.list.link}/${profile.code}/${profile.can_edit ? 'edit' : 'view'}`);
  }

  /** Abre el diálogo de retiro; trae las personas para avisar a cuántas afecta. */
  askRetire(profile: ProfileItem): void {
    this.retiring.set(profile);
    this.retireDetail.set(null);
    this.retireError.set(null);
    this.reason = '';
    this.retireLoading.set(true);
    this.service.show(profile.code).subscribe({
      next: response => {
        this.retireDetail.set(response.payload.data ?? null);
        this.retireLoading.set(false);
      },
      error: error => {
        this.retireError.set(profileError(error).message);
        this.retireLoading.set(false);
      },
    });
  }

  closeRetire(): void {
    this.retiring.set(null);
  }

  get canRetire(): boolean {
    return this.reason.trim().length >= MIN_RETIRE_REASON && !this.retireSaving() && !this.retireLoading();
  }

  confirmRetire(): void {
    const profile = this.retiring();
    if (!profile || !this.canRetire) {
      return;
    }

    this.retireSaving.set(true);
    this.retireError.set(null);
    this.service.retire(profile.code, this.reason.trim()).subscribe({
      next: () => {
        this.retireSaving.set(false);
        this.retiring.set(null);
        this.load();
      },
      error: error => {
        this.retireError.set(profileError(error).message);
        this.retireSaving.set(false);
      },
    });
  }
}
