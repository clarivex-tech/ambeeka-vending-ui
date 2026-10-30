import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmDialogService } from '../../../../../shared/services/confirm-dialog.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { PricingItem } from '../../models/pricing.model';
import { PricingService } from '../../services/pricing.service';

@Component({
  selector: 'vpa-pricing-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, ButtonModule, TableModule],
  templateUrl: './pricing-list.component.html',
  styleUrl: './pricing-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingListComponent implements OnInit {
  private readonly pricingService = inject(PricingService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly notifications = inject(NotificationService);

  readonly items = signal<PricingItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading.set(true);
    this.error.set(null);
    this.pricingService.getAll().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load pricing items. Please try again.');
        this.loading.set(false);
      },
    });
  }

  async deleteItem(item: PricingItem): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: 'Delete pricing item?',
      message: `Delete the pricing record for “${item.productName}”? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;

    this.deletingId.set(item.id);
    this.pricingService.delete(item.id).subscribe({
      next: () => {
        this.items.update((items) => items.filter((current) => current.id !== item.id));
        this.deletingId.set(null);
        this.notifications.success('Pricing item deleted.');
      },
      error: () => {
        this.deletingId.set(null);
        this.notifications.error('Could not delete the pricing item. Please try again.');
      },
    });
  }
}
