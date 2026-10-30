import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { WeeklyBillingNavComponent } from '../../components/weekly-billing-nav/weekly-billing-nav.component';
import { WorkbookImportResult, WorkbookValidationIssue } from '../../models/weekly-billing.model';
import { WeeklyBillingService } from '../../services/weekly-billing.service';

interface ExistingImportInfo {
  existingImportId: string;
  fileName?: string;
  status?: string;
  createdAt?: string;
}

@Component({
  selector: 'vpa-import-processing',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, ButtonModule, WeeklyBillingNavComponent],
  templateUrl: './import-processing.component.html',
  styleUrl: './import-processing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportProcessingComponent {
  private readonly billing = inject(WeeklyBillingService);
  readonly file = signal<File | null>(null);
  readonly validation = signal<WorkbookImportResult | null>(null);
  readonly validationIssues = signal<string[]>([]);
  readonly existingImport = signal<ExistingImportInfo | null>(null);
  readonly validating = signal(false);
  readonly error = signal<string | null>(null);
  readonly fileError = signal<string | null>(null);

  rowCountEntries(): Array<[string, number]> {
    return Object.entries(this.validation()?.rowCounts ?? {});
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    this.file.set(selected);
    this.validation.set(null);
    this.validationIssues.set([]);
    this.existingImport.set(null);
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

  validate(): void {
    const selected = this.file();
    if (!selected || this.fileError()) return;
    this.validating.set(true);
    this.error.set(null);
    this.validationIssues.set([]);
    this.existingImport.set(null);
    this.billing.validateWorkbook(selected).subscribe({
      next: (result) => {
        this.validation.set(result);
        this.validating.set(false);
      },
      error: (failure: unknown) => {
        const body = this.responseBody(failure);
        const issues = this.formatIssues(failure);
        this.validationIssues.set(issues);
        if (typeof body?.existingImportId === 'string') {
          this.existingImport.set({
            existingImportId: body.existingImportId,
            fileName: this.optionalString(body.fileName),
            status: this.optionalString(body.status),
            createdAt: this.optionalString(body.createdAt),
          });
        }
        const serverMessage = this.optionalString(body?.message);
        this.error.set(serverMessage ?? (issues.length > 0
          ? 'The workbook has validation issues. Review them below.'
          : 'Workbook upload failed. Please try again.'));
        this.validating.set(false);
      },
    });
  }

  private formatIssues(error: unknown): string[] {
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
}
