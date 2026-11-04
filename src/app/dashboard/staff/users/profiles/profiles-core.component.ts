import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { StatusTagComponent } from '../../../../core/components/status-tag.component';
import { CorePublication, CorePublicationStatus, ProfilesService, profileError } from '../../../../services/profiles.service';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

const CORE_STATUS: Record<string, { label: string; severity: Severity; meaning: string }> = {
  pending: { label: 'Pendiente', severity: 'warn', meaning: 'Espera que quien administra Core lo active. Mientras, solo se asigna en Academical.' },
  active: { label: 'Activo', severity: 'success', meaning: 'Core ya puede asignarlo.' },
  inactive: { label: 'Inactivo', severity: 'secondary', meaning: 'Core lo tiene desactivado.' },
  retired: { label: 'Retirado', severity: 'danger', meaning: 'Ya no se publica; Core no lo da.' },
};

/**
 * Publicación de perfiles a Core: la última publicación, lo que Core respondió por cada perfil propio y el historial de intentos. Solo administrador.
 * Cada vez se envía la lista completa; Core deja los nuevos Pendientes y retira los que ya no vienen. Maqueta: docs/design/perfiles-mock (pantalla 4).
 */
@Component({
  selector: 'app-profiles-core',
  imports: [ButtonModule, MessageModule, SkeletonModule, TableModule, StatusTagComponent],
  templateUrl: './profiles-core.component.html',
  styleUrl: './profiles-core.component.css',
})
export class ProfilesCoreComponent implements OnInit {
  readonly status = signal<CorePublicationStatus | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly publishing = signal(false);
  readonly publishError = signal<string | null>(null);
  readonly justPublished = signal(false);
  readonly skeletonRows = Array.from({ length: 3 }, (_, index) => index);

  /** La foto de personas para la conciliación de Core: lo último que se envió desde esta pantalla. */
  readonly peopleSending = signal(false);
  readonly peopleResult = signal<number | null>(null);
  readonly peopleError = signal<string | null>(null);

  constructor(private service: ProfilesService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.coreStatus().subscribe({
      next: response => {
        this.status.set(response.payload.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  publish(): void {
    this.publishing.set(true);
    this.publishError.set(null);
    this.justPublished.set(false);
    this.service.publishToCore().subscribe({
      next: response => {
        this.status.set(response.payload.data ?? null);
        this.justPublished.set(true);
        this.publishing.set(false);
      },
      error: error => {
        this.publishError.set(profileError(error).message);
        this.publishing.set(false);
        this.load();
      },
    });
  }

  /** Envía la foto de personas a Core ahora (también se envía sola cada noche). */
  sendPeople(): void {
    this.peopleSending.set(true);
    this.peopleError.set(null);
    this.peopleResult.set(null);
    this.service.publishPeopleToCore().subscribe({
      next: response => {
        this.peopleResult.set(response.payload.data?.received ?? 0);
        this.peopleSending.set(false);
      },
      error: error => {
        this.peopleError.set(profileError(error).message);
        this.peopleSending.set(false);
      },
    });
  }

  back(): void {
    this.router.navigateByUrl(`/${PATHS.profiles.list.link}`);
  }

  coreTag(profile: { core_status: string | null; retired: boolean }): { label: string; severity: Severity; meaning: string } {
    if (profile.retired && profile.core_status !== 'retired') {
      return { label: 'Retirado aquí', severity: 'secondary', meaning: 'Se retiró en Academical; la próxima publicación lo retira en Core.' };
    }

    return (profile.core_status && CORE_STATUS[profile.core_status]) || { label: 'Sin publicar', severity: 'secondary', meaning: 'Todavía no se envió a Core.' };
  }

  resultTag(publication: CorePublication): { label: string; severity: Severity } {
    return publication.status === 'sent' ? { label: 'Enviada', severity: 'success' } : { label: 'Falló', severity: 'danger' };
  }
}
