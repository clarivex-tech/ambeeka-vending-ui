import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GridApi, ICellRendererParams, IRowNode } from 'ag-grid-community';
import { PricingItem } from '../../models/pricing.model';
import { PricingActionsCellRenderer } from './pricing-actions-cell-renderer.component';

describe('PricingActionsCellRenderer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingActionsCellRenderer],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('passes the row item to the delete handler', () => {
    const item: PricingItem = {
      id: 'pricing-1',
      systemProductId: 'product-1',
      systemProductName: 'Granola Bar',
      vendPrice: 1.25,
      productName: 'Granola Bar',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    };
    const onDelete = jasmine.createSpy('onDelete');
    const fixture = TestBed.createComponent(PricingActionsCellRenderer);
    const params = {
      api: jasmine.createSpyObj<GridApi<PricingItem>>('api', ['getGridId']),
      context: {},
      value: null,
      valueFormatted: null,
      data: item,
      node: jasmine.createSpyObj<IRowNode<PricingItem>>('rowNode', ['isSelected']),
      eGridCell: document.createElement('div'),
      eParentOfValue: document.createElement('div'),
      registerRowDragger: () => undefined,
      setTooltip: () => undefined,
      onDelete,
      deletingId: signal<string | null>(null),
    } satisfies ICellRendererParams<PricingItem> & {
      onDelete: typeof onDelete;
      deletingId: ReturnType<typeof signal<string | null>>;
    };

    fixture.componentInstance.agInit(params);
    fixture.detectChanges();

    const deleteButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('button[aria-label="Delete Granola Bar"]');

    expect(deleteButton).not.toBeNull();
    deleteButton?.click();
    expect(onDelete).toHaveBeenCalledOnceWith(item);
  });
});
