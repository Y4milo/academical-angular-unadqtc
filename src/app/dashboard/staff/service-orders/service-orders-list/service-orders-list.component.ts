import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { PATHS } from '../../../../core/constants/app-paths.constants';
import { STATUS } from '../../../../core/constants/api-status.constants';
import { ServiceOrderSummary, ServiceOrdersService } from '../../../../services/service-orders.service';
import { NotificationService } from '../../../../services/notification.service';

/** Órdenes de servicio del contratista, con cuántos entregables ya tienen su conformidad. */
@Component({
  selector: 'app-service-orders-list',
  imports: [ButtonModule, MessageModule, SkeletonModule, TagModule],
  templateUrl: './service-orders-list.component.html',
  styleUrl: './service-orders-list.component.css',
})
export class ServiceOrdersListComponent implements OnInit {
  readonly orders = signal<ServiceOrderSummary[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  constructor(
    private service: ServiceOrdersService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.list().subscribe({
      next: response => {
        this.loading.set(false);
        if (response.status === STATUS.success) {
          this.orders.set(response.payload.data);
        } else {
          this.loadError.set(true);
          this.notificationService.notifyApiData(response);
        }
      },
      error: error => {
        this.loading.set(false);
        this.loadError.set(true);
        this.notificationService.notifyApiData(error);
      },
    });
  }

  create(): void {
    this.router.navigateByUrl(PATHS.admin.serviceOrders.newOrder.link);
  }

  open(order: ServiceOrderSummary): void {
    this.router.navigateByUrl(`${PATHS.admin.serviceOrders.link}/${order.id}`);
  }

  isComplete(order: ServiceOrderSummary): boolean {
    return order.finished_count >= order.deliverables_count;
  }
}
