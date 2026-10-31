import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { WeeklyBillingNavComponent } from '../../components/weekly-billing-nav/weekly-billing-nav.component';
import {
  BillingCalculationResponse,
  PricingProductOption,
  PricingResolution,
  PricingReviewIssue,
  PricingReviewResponse,
  WorkbookImportResult,
  WorkbookValidationIssue,
} from '../../models/weekly-billing.model';
import { WeeklyBillingService } from '../../services/weekly-billing.service';

interface ExistingImportInfo {
  existingImportId: string;
  displayName?: string;
  fileName?: string;
  status?: string;
  createdAt?: string;
}

@Component({
  selector: 'vpa-import-processing',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink, ButtonModule, WeeklyBillingNavComponent],
  templateUrl: './import-processing.component.html',
  styleUrl: './import-processing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportProcessingComponent {
  private readonly billing = inject(WeeklyBillingService);
  private reviewRequestId = 0;
  readonly file = signal<File | null>(null);
  readonly displayName = signal('');
  readonly validation = signal<WorkbookImportResult | null>(null);
  readonly validationIssues = signal<string[]>([]);
  readonly existingImport = signal<ExistingImportInfo | null>(null);
  readonly existingPricingReview = signal<PricingReviewResponse | null>(null);
  readonly review = signal<PricingReviewResponse | null>(null);
  readonly reviewScopeLoaded = signal(false);
  readonly resolutions = signal<Record<string, PricingResolution>>({});
  readonly calculation = signal<BillingCalculationResponse | null>(null);
  readonly step = signal<1 | 2 | 3>(1);
  readonly month = signal(this.currentMonth());
  readonly employers = ['Warren Valve'];
  readonly employer = signal(this.employers[0]);
  readonly calculationName = signal(this.defaultCalculationName());
  private calculationNameEdited = false;
  readonly validating = signal(false);
  readonly reviewLoading = signal(false);
  readonly calculating = signal(false);
  readonly error = signal<string | null>(null);
  readonly reviewError = signal<string | null>(null);
  readonly calculationError = signal<string | null>(null);
  readonly fileError = signal<string | null>(null);

  rowCountEntries(): [string, number][] {
    return Object.entries(this.validation()?.rowCounts ?? {});
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    this.file.set(selected);
    this.displayName.set(selected?.name.replace(/\.xlsx$/i, '') ?? '');
    this.validation.set(null);
    this.validationIssues.set([]);
    this.existingImport.set(null);
    this.existingPricingReview.set(null);
    this.error.set(null);
    this.fileError.set(null);
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.xlsx')) {
      this.file.set(null);
      this.fileError.set('Choose an .xlsx workbook.');
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      this.file.set(null);
      this.fileError.set('The workbook must be 15 MB or smaller.');
    }
  }

  setMonth(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.month.set(value);
    this.updateDefaultCalculationName();
    this.scopeChanged();
  }

  setEmployer(event: Event): void {
    this.employer.set((event.target as HTMLSelectElement).value);
    this.updateDefaultCalculationName();
    this.scopeChanged();
  }

  setDisplayName(event: Event): void {
    this.displayName.set((event.target as HTMLInputElement).value);
  }

  setCalculationName(event: Event): void {
    this.calculationName.set((event.target as HTMLInputElement).value);
    this.calculationNameEdited = true;
  }

  validate(): void {
    const selected = this.file();
    if (!selected || this.fileError()) return;
    this.validating.set(true);
    this.error.set(null);
    this.validationIssues.set([]);
    this.existingImport.set(null);
    this.existingPricingReview.set(null);
    this.billing.validateWorkbook(selected, this.displayName()).subscribe({
      next: (result) => {
        this.validation.set(result);
        this.validating.set(false);
        this.step.set(2);
        this.review.set(null);
        this.loadPricingReview();
      },
      error: (failure: unknown) => {
        const body = this.responseBody(failure);
        const issues = this.formatWorkbookIssues(failure);
        this.validationIssues.set(issues);
        const existingImportId = this.optionalString(body?.existingImportId);
        if (existingImportId) {
          this.existingImport.set({
            existingImportId,
            displayName: this.optionalString(body?.displayName),
            fileName: this.optionalString(body?.fileName),
            status: this.optionalString(body?.status),
            createdAt: this.optionalString(body?.createdAt),
          });
          this.step.set(2);
          this.billing.getImportPricingReview(existingImportId).subscribe({
            next: (review) => this.existingPricingReview.set(review),
          });
          this.loadPricingReview();
        }
        const serverMessage = this.optionalString(body?.message);
        this.error.set(serverMessage ?? (issues.length > 0
          ? 'The workbook has validation issues. Correct them and upload it again.'
          : 'Workbook upload failed. Please try again.'));
        this.validating.set(false);
      },
    });
  }

  loadPricingReview(): void {
    const requestId = ++this.reviewRequestId;
    this.reviewScopeLoaded.set(false);
    const month = this.month();
    const employer = this.employer().trim();
    if (!month || !employer) {
      this.reviewError.set('Choose a billing month and employer to check pricing review rows.');
      this.reviewLoading.set(false);
      return;
    }
    this.reviewLoading.set(true);
    this.reviewError.set(null);
    this.calculationError.set(null);
    this.calculation.set(null);
    this.billing.getPricingReview(month, employer).subscribe({
      next: (review) => {
        if (requestId !== this.reviewRequestId) return;
        this.review.set(review);
        this.reviewScopeLoaded.set(true);
        this.reviewLoading.set(false);
      },
      error: (failure: unknown) => {
        if (requestId !== this.reviewRequestId) return;
        this.reviewScopeLoaded.set(false);
        const message = this.optionalString(this.responseBody(failure)?.message);
        this.reviewError.set(message ?? 'Could not load pricing review rows for this month and employer.');
        this.reviewLoading.set(false);
      },
    });
  }

  mapIssue(issue: PricingReviewIssue, event: Event): void {
    const productId = (event.target as HTMLSelectElement).value;
    const key = this.issueKey(issue);
    const product = this.allProducts().find((option) => option.productId === productId);
    if (!product) {
      this.removeResolution(key);
      return;
    }
    this.resolutions.update((current) => ({
      ...current,
      [key]: { importId: issue.importId, sourceRowNumber: issue.sourceRowNumber, action: 'Map', productId },
    }));
  }

  ignoreIssue(issue: PricingReviewIssue): void {
    const key = this.issueKey(issue);
    this.resolutions.update((current) => ({
      ...current,
      [key]: { importId: issue.importId, sourceRowNumber: issue.sourceRowNumber, action: 'Ignore' },
    }));
  }

  clearResolution(issue: PricingReviewIssue): void {
    this.removeResolution(this.issueKey(issue));
  }

  resolution(issue: PricingReviewIssue): PricingResolution | undefined {
    return this.resolutions()[this.issueKey(issue)];
  }

  mappedProductId(issue: PricingReviewIssue): string {
    const resolution = this.resolution(issue);
    return resolution?.action === 'Map' ? resolution.productId : '';
  }

  appliedResolutionCount(calculation: BillingCalculationResponse): number {
    return calculation.result.appliedResolutions?.length ?? 0;
  }

  issueKey(issue: PricingReviewIssue): string {
    return `${issue.importId}:${issue.sourceRowNumber}`;
  }

  reasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      MissingProductName: 'Missing product name',
      AliasNotFound: 'No matching POS alias',
      AmbiguousAlias: 'Multiple possible matches',
      InvalidPrice: 'Invalid current price',
    };
    return labels[reason] ?? reason;
  }

  allProducts(): PricingProductOption[] {
    return this.review()?.availableProducts ?? this.validation()?.pricingReview?.availableProducts ?? [];
  }

  resolvedCount(): number {
    return this.review()?.issues.filter((issue) => this.resolution(issue) !== undefined).length ?? 0;
  }

  ignoredCount(): number {
    return Object.values(this.resolutions()).filter((resolution) => resolution.action === 'Ignore').length;
  }

  canCalculate(): boolean {
    const review = this.review();
    return !!review
      && (!!this.validation() || !!this.existingImport())
      && this.reviewScopeLoaded()
      && !!this.month()
      && !!this.employer().trim()
      && !this.reviewLoading()
      && !this.calculating()
      && this.resolvedCount() === review.issues.length;
  }

  calculate(): void {
    const review = this.review();
    const month = this.month();
    const employer = this.employer().trim();
    if (!review || !this.canCalculate() || !month || !employer) return;

    const resolutions = review.issues
      .map((issue) => this.resolution(issue))
      .filter((resolution): resolution is PricingResolution => resolution !== undefined);
    this.calculating.set(true);
    this.calculationError.set(null);
    const calculationName = this.calculationName().trim();
    this.billing.createCalculationPreview(month, employer, resolutions, calculationName).subscribe({
      next: (calculation) => {
        this.calculation.set(calculation);
        this.step.set(3);
        this.calculating.set(false);
      },
      error: (failure: unknown) => {
        const body = this.responseBody(failure);
        this.mergeApiIssues(body);
        const message = this.optionalString(body?.message);
        this.calculationError.set(message ?? 'The API could not create this calculation. Your row decisions are still available; review them and retry.');
        this.calculating.set(false);
      },
    });
  }

  startAnotherImport(): void {
    this.file.set(null);
    this.displayName.set('');
    this.validation.set(null);
    this.validationIssues.set([]);
    this.existingImport.set(null);
    this.existingPricingReview.set(null);
    this.review.set(null);
    this.reviewScopeLoaded.set(false);
    this.resolutions.set({});
    this.calculation.set(null);
    this.error.set(null);
    this.reviewError.set(null);
    this.calculationError.set(null);
    this.fileError.set(null);
    this.calculationNameEdited = false;
    this.calculationName.set(this.defaultCalculationName());
    this.step.set(1);
  }

  private scopeChanged(): void {
    this.review.set(null);
    this.reviewScopeLoaded.set(false);
    this.calculation.set(null);
    this.calculationError.set(null);
    if (this.step() === 3) this.step.set(2);
    if (this.step() >= 2 && (this.validation() || this.existingImport())) this.loadPricingReview();
  }

  private mergeApiIssues(body: Record<string, unknown> | null): void {
    if (!body || !Array.isArray(body.issues)) return;
    const returnedIssues = body.issues.filter((issue): issue is PricingReviewIssue => this.isPricingReviewIssue(issue));
    if (returnedIssues.length === 0) return;

    const current = this.review();
    const mergedIssues = new Map<string, PricingReviewIssue>();
    for (const issue of [...(current?.issues ?? []), ...returnedIssues]) {
      mergedIssues.set(this.issueKey(issue), issue);
    }
    const availableProducts = Array.isArray(body.availableProducts)
      ? body.availableProducts as PricingProductOption[]
      : current?.availableProducts ?? [];
    this.review.set({
      month: current?.month ?? this.month(),
      employer: current?.employer ?? this.employer(),
      transactionsReviewed: current?.transactionsReviewed ?? mergedIssues.size,
      rowsNeedingReview: mergedIssues.size,
      issues: [...mergedIssues.values()],
      availableProducts,
      priceBasis: current?.priceBasis ?? 'CurrentCatalog',
      pricingWarning: current?.pricingWarning ?? '',
    });
  }

  private isPricingReviewIssue(value: unknown): value is PricingReviewIssue {
    if (typeof value !== 'object' || value === null) return false;
    const issue = value as Record<string, unknown>;
    return typeof issue.importId === 'string'
      && typeof issue.sourceRowNumber === 'number'
      && typeof issue.transactionId === 'string'
      && (typeof issue.machineName === 'string' || issue.machineName === null)
      && typeof issue.machineSettlementTime === 'string'
      && typeof issue.reason === 'string';
  }

  private removeResolution(key: string): void {
    this.resolutions.update((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  private formatWorkbookIssues(error: unknown): string[] {
    if (!(error instanceof HttpErrorResponse) || error.status !== 400) return [];
    const issues = this.responseBody(error)?.issues;
    if (!Array.isArray(issues)) return [];
    return (issues as WorkbookValidationIssue[]).map((issue) => {
      if (typeof issue === 'string') return issue;
      const prefix = issue.rowNumber === undefined ? '' : `Row ${issue.rowNumber}: `;
      return `${prefix}${issue.message}`;
    });
  }

  private responseBody(error: unknown): Record<string, unknown> | null {
    if (!(error instanceof HttpErrorResponse) || typeof error.error !== 'object' || error.error === null) return null;
    return error.error as Record<string, unknown>;
  }

  private optionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private defaultCalculationName(): string {
    const month = this.month();
    if (!/^\d{4}-\d{2}$/.test(month)) return `${this.employer()} · Billing`;
    const date = new Date(`${month}-01T12:00:00`);
    const period = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
    return `${this.employer()} · ${period}`;
  }

  private updateDefaultCalculationName(): void {
    if (!this.calculationNameEdited) this.calculationName.set(this.defaultCalculationName());
  }
}
