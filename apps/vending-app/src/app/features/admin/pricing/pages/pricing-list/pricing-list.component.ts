import { formatCurrency, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { AllCommunityModule, ColDef, GridOptions, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogService } from '../../../../../shared/services/confirm-dialog.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { PricingItem } from '../../models/pricing.model';
import { PricingService } from '../../services/pricing.service';
import { PricingActionsCellRenderer } from './pricing-actions-cell-renderer.component';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'vpa-pricing-list',
  standalone: true,
  imports: [RouterLink, ButtonModule, InputTextModule, AgGridAngular],
  templateUrl: './pricing-list.component.html',
  styleUrl: './pricing-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingListComponent implements OnInit {
  private readonly pricingService = inject(PricingService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly notifications = inject(NotificationService);

  readonly items = signal<PricingItem[]>([]);
  readonly searchTerm = signal('');
  readonly filteredItems = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    if (!query) return this.items();

    return this.items().filter((item) =>
      [item.systemProductId, item.systemProductName, item.productName]
        .some((value) => value.toLocaleLowerCase().includes(query)),
    );
  });
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly columnDefs: ColDef<PricingItem>[] = [
    {
      field: 'productName',
      headerName: 'Product name',
      minWidth: 200,
    },
    {
      field: 'vendPrice',
      headerName: 'Vend price',
      valueFormatter: ({ value }) =>
        typeof value === 'number' ? formatCurrency(value, 'en-US', '$', 'USD') : '',
      minWidth: 140,
    },
    {
      field: 'updatedAt',
      headerName: 'Last updated',
      valueFormatter: ({ value }) =>
        typeof value === 'string' ? formatDate(value, 'mediumDate', 'en-US') : '',
      minWidth: 160,
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      cellRenderer: PricingActionsCellRenderer,
      cellRendererParams: {
        onDelete: (item: PricingItem) => void this.deleteItem(item),
        deletingId: this.deletingId,
      },
      sortable: false,
      filter: false,
      resizable: false,
      width: 112,
      minWidth: 112,
      maxWidth: 112,
    },
  ];
  readonly gridOptions: GridOptions<PricingItem> = {
    theme: themeQuartz,
    defaultColDef: {
      sortable: true,
      resizable: true,
      filter: true,
      flex: 1,
      minWidth: 120,
    },
    domLayout: 'autoHeight',
    rowHeight: 52,
    getRowId: ({ data }) => data.id,
  };

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

  setSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
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
