import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { EMPTY } from 'rxjs';
import { ImportProcessingComponent } from './import-processing.component';
import { WeeklyBillingService } from '../../services/weekly-billing.service';
import { PricingReviewIssue } from '../../models/weekly-billing.model';

describe('ImportProcessingComponent product groups', () => {
  let component: ImportProcessingComponent;
  let billing: jasmine.SpyObj<WeeklyBillingService>;

  function issue(row: number, name: string | null, importId = 'import-1'): PricingReviewIssue {
    return {
      importId, sourceRowNumber: row, transactionId: `transaction-${row}`,
      machineName: 'Machine', machineSettlementTime: '2026-11-05T12:00:00Z',
      settlementValue: 1.5, productSelectionInfo: name, productAlias: null,
      reason: name ? 'AliasNotFound' : 'MissingProductName', suggestedProducts: [],
    };
  }

  function setReview(issues: PricingReviewIssue[]): void {
    component.review.set({
      issues, transactionsReviewed: issues.length, rowsNeedingReview: issues.length,
      priceBasis: 'CurrentCatalog', pricingWarning: '',
      availableProducts: [{ productId: 'pizza', productName: 'Pizza', posAlias: 'pizza', price: 3 }],
    });
    component.validation.set({ id: 'import-1' });
    component.reviewLoaded.set(true);
  }

  function mapFirstGroup(): void {
    const select = document.createElement('select');
    select.add(new Option('Pizza', 'pizza'));
    component.mapGroup(component.issueGroups()[0], { target: select } as unknown as Event);
  }

  beforeEach(() => {
    billing = jasmine.createSpyObj<WeeklyBillingService>('billing', ['createImportCalculation']);
    billing.createImportCalculation.and.returnValue(EMPTY);
    TestBed.configureTestingModule({ providers: [
      { provide: WeeklyBillingService, useValue: billing },
      { provide: ActivatedRoute, useValue: { paramMap: EMPTY } },
    ] });
    component = TestBed.runInInjectionContext(() => new ImportProcessingComponent());
  });

  it('groups normalized names while keeping variants, imports and unnamed rows separate', () => {
    setReview([
      issue(1, ' Hot Pocket  Pep Pizza '), issue(2, 'hot pocket pep pizza'),
      issue(3, 'Hot Pocket Pep Pizza 9 oz'), issue(4, null), issue(5, ' '),
      issue(6, 'Hot Pocket Pep Pizza', 'import-2'),
    ]);
    expect(component.issueGroups().map((group) => group.issues.length)).toEqual([2, 1, 1, 1, 1]);
    expect(component.groupSettlement(component.issueGroups()[0])).toBe(3);
  });

  it('submits one resolution per transaction after a single product selection', () => {
    setReview(Array.from({ length: 6 }, (_, index) => issue(index + 1, 'Hot Pocket Pep Pizza')));
    expect(component.canCalculate()).toBeFalse();
    mapFirstGroup();
    expect(component.resolvedCount()).toBe(6);
    expect(component.canCalculate()).toBeTrue();
    component.calculate();
    expect(billing.createImportCalculation).toHaveBeenCalledWith('import-1',
      Array.from({ length: 6 }, (_, index) => ({ sourceRowNumber: index + 1, action: 'Map', productId: 'pizza' })), '');
  });

  it('ignores and clears the whole group without changing another product', () => {
    setReview([issue(1, 'Pizza'), issue(2, 'pizza'), issue(3, 'Tea')]);
    const [pizza, tea] = component.issueGroups();
    component.ignoreGroup(tea);
    mapFirstGroup();
    component.ignoreGroup(pizza);
    expect(component.ignoredCount()).toBe(3);
    component.clearGroup(pizza);
    expect(component.resolvedCount()).toBe(1);
    expect(component.resolution(tea.issues[0])?.action).toBe('Ignore');
    expect(component.canCalculate()).toBeFalse();
  });

  it('does not present partial decisions as resolved and preserves saved per-row decisions', () => {
    setReview([issue(1, 'Pizza'), issue(2, 'pizza')]);
    component.resolutions.set({ 'import-1:1': { sourceRowNumber: 1, action: 'Ignore' } });
    expect(component.groupResolution(component.issueGroups()[0])).toBeUndefined();
    expect(component.groupHasDecision(component.issueGroups()[0])).toBeTrue();
    component.readOnlyView.set(true);
    expect(component.issueGroups().length).toBe(2);
    expect(component.resolution(component.issueGroups()[0].issues[0])?.action).toBe('Ignore');
    expect(component.resolution(component.issueGroups()[1].issues[0])).toBeUndefined();
  });
});
