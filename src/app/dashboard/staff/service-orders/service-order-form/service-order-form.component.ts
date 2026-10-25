import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FormFieldComponent } from '../../../../core/components/form-field.component';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { NotificationService } from '../../../../services/notification.service';
import { ServiceOrdersService, toIsoDate } from '../../../../services/service-orders.service';

interface DeliverableRow {
  due: Date | null;
  activity: string;
}

type FieldErrors = Partial<Record<'ruc' | 'contractor' | 'orderNumber' | 'notifiedAt' | 'amount' | 'denomination' | 'rows', string>>;

const ORDINALS = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo', 'Undécimo', 'Duodécimo'];
const DAY_MS = 86_400_000;

/** Alta de una orden de servicio: contratista (por RUC, desde Core), datos de la orden y fecha de cada entregable. */
@Component({
  selector: 'app-service-order-form',
  imports: [FormsModule, ButtonModule, DatePickerModule, InputNumberModule, InputTextModule, TextareaModule, FormFieldComponent],
  templateUrl: './service-order-form.component.html',
  styleUrl: './service-order-form.component.css',
})
export class ServiceOrderFormComponent {
  readonly ordinals = ORDINALS;

  ruc = '';
  contractorName = '';
  orderNumber: number | null = null;
  notifiedAt: Date | null = null;
  amount: number | null = 3000;
  count = 3;
  denomination = '';
  rows: DeliverableRow[] = this.emptyRows(3);

  readonly searching = signal(false);
  readonly saving = signal(false);
  readonly errors = signal<FieldErrors>({});

  constructor(
    private service: ServiceOrdersService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  /** El RUC lleva 11 dígitos; mientras no estén completos no se consulta. */
  get rucReady(): boolean {
    return /^\d{11}$/.test(this.ruc);
  }

  lookupRuc(): void {
    if (!this.rucReady) {
      this.setError('ruc', 'El RUC tiene 11 dígitos.');
      return;
    }
    this.searching.set(true);
    this.service.taxpayer(this.ruc).subscribe({
      next: response => {
        this.searching.set(false);
        if (response.status === STATUS.success) {
          this.contractorName = response.payload.data.business_name;
          this.setError('ruc', '');
          this.setError('contractor', '');
        } else {
          this.setError('ruc', response.payload?.message || 'No se encontró el RUC en Core.');
        }
      },
      error: error => {
        this.searching.set(false);
        this.notificationService.notifyApiData(error);
      },
    });
  }

  setCount(value: number | null): void {
    this.count = Math.min(12, Math.max(1, Math.round(value ?? 1)));
    this.rows = Array.from({ length: this.count }, (_, index) => this.rows[index] ?? { due: null, activity: '' });
  }

  /** Días calendario entre la notificación y el vencimiento, como el "Plazo de ejecución" del informe. */
  daysFor(row: DeliverableRow): number | null {
    if (!this.notifiedAt || !row.due) {
      return null;
    }
    return Math.round((row.due.getTime() - this.notifiedAt.getTime()) / DAY_MS);
  }

  save(): void {
    const errors: FieldErrors = {};
    if (!this.rucReady) {
      errors.ruc = 'Escribe un RUC de 11 dígitos.';
    }
    if (!this.contractorName.trim()) {
      errors.contractor = 'Busca el RUC para traer el nombre del contratista.';
    }
    if (!this.orderNumber || this.orderNumber < 1) {
      errors.orderNumber = 'Escribe el número de la orden.';
    }
    if (!this.notifiedAt) {
      errors.notifiedAt = 'Elige la fecha de notificación.';
    }
    if (this.amount === null || this.amount < 0) {
      errors.amount = 'Escribe el monto de cada entregable.';
    }
    if (!this.denomination.trim()) {
      errors.denomination = 'Escribe la denominación del servicio.';
    }
    if (this.rows.some(row => !row.due)) {
      errors.rows = 'Falta la fecha de vencimiento de algún entregable.';
    }
    this.errors.set(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    this.saving.set(true);
    this.service.create({
      ruc: this.ruc,
      contractor_name: this.contractorName.trim(),
      order_number: this.orderNumber!,
      notified_at: toIsoDate(this.notifiedAt)!,
      amount_per_deliverable: this.amount!,
      deliverables_count: this.count,
      denomination: this.denomination.trim(),
      deliverables: this.rows.map(row => ({ due_date: toIsoDate(row.due)!, activity: row.activity.trim() || null })),
    }).subscribe({
      next: response => {
        this.saving.set(false);
        if (response.status === STATUS.success) {
          this.router.navigateByUrl(`${PATHS.admin.serviceOrders.link}/${response.payload.data.id}`);
        } else {
          this.notificationService.notifyApiData(response);
        }
      },
      error: error => {
        this.saving.set(false);
        this.notificationService.notifyApiData(error);
      },
    });
  }

  cancel(): void {
    this.router.navigateByUrl(PATHS.admin.serviceOrders.link);
  }

  private setError(key: keyof FieldErrors, message: string): void {
    this.errors.update(current => ({ ...current, [key]: message || undefined }));
  }

  private emptyRows(count: number): DeliverableRow[] {
    return Array.from({ length: count }, () => ({ due: null, activity: '' }));
  }
}
