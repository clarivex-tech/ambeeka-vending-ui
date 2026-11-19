import { ChangeDetectionStrategy, Component, Signal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { PricingItem } from '../../models/pricing.model';

interface PricingActionsCellParams extends ICellRendererParams<PricingItem> {
  onDelete: (item: PricingItem) => void;
  deletingId: Signal<string | null>;
}

@Component({
  selector: 'vpa-pricing-actions-cell-renderer',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  template: `
    @if (item(); as item) {
      <div class="pricing-actions">
        <p-button
          icon="pi pi-pencil"
          severity="secondary"
          [text]="true"
          [routerLink]="['/admin/pricing', item.id, 'edit']"
          [ariaLabel]="'Edit ' + item.productName"
        />
        <p-button
          icon="pi pi-trash"
          severity="danger"
          [text]="true"
          [loading]="deletingId() === item.id"
          [disabled]="deletingId() !== null"
          [ariaLabel]="'Delete ' + item.productName"
          (onClick)="deleteItem(item)"
        />
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .pricing-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.25rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingActionsCellRenderer implements ICellRendererAngularComp {
  readonly item = signal<PricingItem | null>(null);
  deletingId: Signal<string | null> = signal(null);
  private deleteItemCallback: ((item: PricingItem) => void) | null = null;

  agInit(params: ICellRendererParams<PricingItem>): void {
    this.updateParams(params);
  }

  refresh(params: ICellRendererParams<PricingItem>): boolean {
    this.updateParams(params);
    return true;
  }

  deleteItem(item: PricingItem): void {
    if (!this.deleteItemCallback) {
      throw new Error('Pricing actions renderer is missing its delete handler.');
    }
    this.deleteItemCallback(item);
  }

  private updateParams(params: ICellRendererParams<PricingItem>): void {
    const actionParams = params as PricingActionsCellParams;
    if (!actionParams.onDelete || !actionParams.deletingId) {
      throw new Error('Pricing actions renderer requires delete handler parameters.');
    }
    this.item.set(actionParams.data ?? null);
    this.deleteItemCallback = actionParams.onDelete;
    this.deletingId = actionParams.deletingId;
  }
}
