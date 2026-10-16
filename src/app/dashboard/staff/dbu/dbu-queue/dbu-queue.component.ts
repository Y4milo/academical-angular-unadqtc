import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { Select } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { AppLucideIconComponent } from '../../../../core/components/lucide-icon/lucide-icon.component';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { dbuDayLabel, dbuQueueErrorMessage } from './dbu-queue.util';
import {
  DbuQueueAction, DbuQueueItem, DbuQueueNamed, DbuQueueResult, DbuQueueService,
} from '../../../../services/dbu-queue.service';
import { NotificationService } from '../../../../services/notification.service';
import { DBU_STATUS_VIEW, STATE_SEVERITY, TagSeverity } from '../../../../shared/ui/ui-tokens';

interface Option { label: string; value: string | number | null }

const EVENT_LABELS: Record<string, string> = {
  reserved: 'Reservó la cita',
  cancelled: 'Se canceló la cita',
  attended: 'Se marcó como atendida',
  no_show: 'Se marcó como no asistió',
  confirm: 'Se confirmó la solicitud',
  reject: 'Se rechazó la solicitud',
  cancel: 'Se canceló la cita',
  reopen: 'Se deshizo la atención',
  reassigned: 'Se cambió de encargado',
  note_saved: 'Se guardó una nota',
};

const ACTOR_LABELS: Record<string, string> = { student: 'Alumno', user: 'Personal', system: 'Sistema' };

/** Cola de citas de Bienestar Universitario: lo del día, sus filtros y las acciones sobre cada cita. */
@Component({
  selector: 'app-dbu-queue',
  imports: [
    FormsModule, AppLucideIconComponent, ButtonModule, DatePickerModule, DialogModule, DrawerModule, IconFieldModule, InputIconModule,
    InputTextModule, MessageModule, Select, SkeletonModule, TagModule, TextareaModule,
  ],
  templateUrl: './dbu-queue.component.html',
  styleUrl: './dbu-queue.component.css',
})
export class DbuQueueComponent implements OnInit {
  readonly result = signal<DbuQueueResult | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly busy = signal(false);

  date: Date = new Date();
  status: string | null = null;
  typeId: number | null = null;
  attendantId: number | null = null;
  search = '';

  readonly selected = signal<DbuQueueItem | null>(null);
  readonly drawerOpen = signal(false);
  readonly detailError = signal('');
  note = '';
  newAttendantId: number | null = null;

  cancelDialog = false;
  cancelMode: 'cancel' | 'reject' = 'cancel';
  cancelReason = '';

  readonly statusOptions: Option[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Reservadas', value: 'reserved' },
    { label: 'Pendientes', value: 'pending' },
    { label: 'Atendidas', value: 'attended' },
    { label: 'No asistió', value: 'no_show' },
    { label: 'Canceladas', value: 'cancelled' },
  ];
  readonly typeOptions = computed<Option[]>(() => [{ label: 'Todas las atenciones', value: null }, ...this.named(this.result()?.types)]);
  readonly attendantOptions = computed<Option[]>(() => [{ label: 'Todos los encargados', value: null }, ...this.named(this.result()?.attendants)]);
  readonly reassignOptions = computed<Option[]>(() => this.named(this.result()?.attendants).filter(option => option.value !== this.selected()?.attendant_id));
  readonly skeletonRows = [1, 2, 3, 4];
  readonly dayNote = computed(() => dbuDayLabel(this.result()?.date ?? this.isoDate(this.date)));

  constructor(
    private service: DbuQueueService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service
      .list({ date: this.isoDate(this.date), status: this.status, type_id: this.typeId, attendant_id: this.attendantId, search: this.search.trim() || null })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: response => this.result.set(response.status === STATUS.success ? response.payload.data : null),
        error: () => this.error.set(true),
      });
  }

  moveDay(delta: number): void {
    const next = new Date(this.date);
    next.setDate(next.getDate() + delta);
    this.date = next;
    this.load();
  }

  today(): void {
    this.date = new Date();
    this.load();
  }

  open(item: DbuQueueItem): void {
    this.selected.set(item);
    this.note = item.note ?? '';
    this.newAttendantId = null;
    this.detailError.set('');
    this.drawerOpen.set(true);
    this.service.show(item.id).subscribe({
      next: response => {
        if (response.status === STATUS.success && this.selected()?.id === item.id) {
          this.selected.set(response.payload.data);
        }
      },
    });
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  run(action: DbuQueueAction, extra: { reason?: string | null; attendant_id?: number | null } = {}): void {
    const item = this.selected();
    if (!item || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.detailError.set('');
    this.service
      .act(item.id, action, { note: this.note.trim() || null, ...extra })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: response => {
          if (response.status === STATUS.success) {
            this.selected.set(response.payload.data);
            this.note = response.payload.data.note ?? '';
            this.cancelDialog = false;
            this.load();
          }
        },
        error: error => this.detailError.set(dbuQueueErrorMessage(error)),
      });
  }

  askCancel(mode: 'cancel' | 'reject'): void {
    this.cancelMode = mode;
    this.cancelReason = '';
    this.cancelDialog = true;
  }

  confirmCancel(): void {
    this.run(this.cancelMode, { reason: this.cancelReason.trim() || null });
  }

  reassign(): void {
    if (this.newAttendantId !== null) {
      this.run('reassign', { attendant_id: this.newAttendantId });
    }
  }

  saveNote(): void {
    this.run('note');
  }

  statusLabel(status: string): string {
    return DBU_STATUS_VIEW[status]?.label ?? status;
  }

  statusSeverity(status: string): TagSeverity {
    return STATE_SEVERITY[DBU_STATUS_VIEW[status]?.kind ?? 'neutral'];
  }

  eventLabel(action: string): string {
    return EVENT_LABELS[action] ?? action;
  }

  actorLabel(type: string): string {
    return ACTOR_LABELS[type] ?? type;
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  private named(items: DbuQueueNamed[] | undefined): Option[] {
    return (items ?? []).map(item => ({ label: item.name, value: item.id }));
  }

  private isoDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
