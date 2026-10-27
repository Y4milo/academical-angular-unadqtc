import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { NotificationService } from '../../../../services/notification.service';
import { StudentModuleSwitch, StudentModulesService } from '../../../../services/student-modules.service';

/** Módulos del estudiante: interruptor general de cada uno. Lo propio de cada módulo se configura en su pantalla. Solo administrador. */
@Component({
  selector: 'app-student-modules',
  imports: [FormsModule, ButtonModule, MessageModule, SkeletonModule, TableModule, ToggleSwitchModule],
  templateUrl: './student-modules.component.html',
  styleUrl: './student-modules.component.css',
})
export class StudentModulesComponent implements OnInit {
  readonly modules = signal<StudentModuleSwitch[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly busyKey = signal<string | null>(null);

  constructor(private service: StudentModulesService, private notifications: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.list().subscribe({
      next: response => {
        this.modules.set(response.payload.data?.modules ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  toggle(module: StudentModuleSwitch, enabled: boolean): void {
    this.busyKey.set(module.key);
    this.service.setEnabled(module.key, enabled).subscribe({
      next: response => {
        this.busyKey.set(null);
        if (response.status !== 'success') {
          this.notifications.error(response.payload.title, response.payload.message);
          this.load();
          return;
        }
        this.modules.set(response.payload.data?.modules ?? this.modules());
        this.notifications.success(response.payload.title, response.payload.message);
      },
      error: () => {
        this.busyKey.set(null);
        this.notifications.error('No se pudo cambiar', 'Revisa tu conexión e inténtalo de nuevo.');
        this.load();
      },
    });
  }
}
