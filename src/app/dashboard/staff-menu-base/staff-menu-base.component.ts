import {Component, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRouteSnapshot, NavigationEnd, Router} from '@angular/router';
import {filter, map, startWith} from 'rxjs';
import {LoginService} from '../../services/login.service';
import {DegreesTitlesBannerComponent} from '../staff/degrees-titles/degrees-titles-banner.component';
import {StaffRoleLayoutComponent} from '../staff/shared/staff-role-layout/staff-role-layout.component';

/** A dónde lleva «Mis asistencias» según el rol; los roles que no registran su propia asistencia no tienen el enlace. */
const OWN_ATTENDANCE: Record<string, string> = {
  admin: '/admin/home',
  hr: '/hr/home',
  academic: '/academic/home',
  professor: '/staff/home',
  administrative: '/staff/home',
};

/** El aviso que una ruta pide sobre el contenido (`data.banner`), buscado de la ruta más profunda hacia arriba. */
function bannerOf(snapshot: ActivatedRouteSnapshot): string | null {
  let found: string | null = null;

  for (let current: ActivatedRouteSnapshot | null = snapshot; current; current = current.firstChild) {
    found = (current.data['banner'] as string | undefined) ?? found;
  }

  return found;
}

/**
 * El marco único del personal. Lo usan todos los módulos (administración, asistencia, académico, contabilidad, Bienestar, grados y títulos,
 * directivas): un solo menú, armado por el servidor con lo que la persona puede hacer, que no se vuelve a crear al pasar de un módulo a otro.
 * Lo poco que antes distinguía a un marco de otro llega por datos: el enlace «Mis asistencias» sale del rol de la persona y el aviso de modo de
 * prueba de grados y títulos, de `data.banner` de su grupo de rutas.
 */
@Component({
  selector: 'app-staff-menu-base',
  imports: [
    StaffRoleLayoutComponent,
    DegreesTitlesBannerComponent,
  ],
  templateUrl: './staff-menu-base.component.html',
  styleUrl: './staff-menu-base.component.css'
})
export class StaffMenuBaseComponent {
  private readonly router = inject(Router);
  private readonly loginService = inject(LoginService);

  protected readonly attendanceRouterLink = OWN_ATTENDANCE[this.loginService.getUser()?.role?.value ?? ''] ?? '';

  protected readonly banner = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => bannerOf(this.router.routerState.snapshot.root)),
      startWith(bannerOf(this.router.routerState.snapshot.root)),
    ),
    {initialValue: null},
  );
}
