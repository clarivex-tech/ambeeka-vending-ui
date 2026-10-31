import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmDialogService } from '../../../../../shared/services/confirm-dialog.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { WeeklyBillingNavComponent } from '../../components/weekly-billing-nav/weekly-billing-nav.component';
import { WorkbookImportHistoryItem, WorkbookImportHistoryPage } from '../../models/weekly-billing.model';
import { WeeklyBillingService } from '../../services/weekly-billing.service';

interface ImportDeleteError {
  message: string;
  importId?: string;
  calculatedAt?: string;
}

@Component({
  selector: 'vpa-import-history',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, ButtonModule, TableModule, WeeklyBillingNavComponent],
  templateUrl: './import-history.component.html',
  styleUrl: './import-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportHistoryComponent implements OnInit {
  private readonly billing = inject(WeeklyBillingService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly notifications = inject(NotificationService);

  readonly pageSize = 20;
  readonly page = signal(1);
  readonly history = signal<WorkbookImportHistoryPage | null>(null);
  readonly loading = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly deleteError = signal<ImportDeleteError | null>(null);

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.deleteError.set(null);
    this.billing.getImportHistory(page, this.pageSize).subscribe({
      next: (result) => {
        if (result.items.length === 0 && result.page > 1 && result.totalCount > 0) {
          this.loadPage(result.page - 1);
          return;
        }
        this.history.set(result);
        this.page.set(result.page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load imported workbook history. Please try again.');
        this.loading.set(false);
      },
    });
  }

  previousPage(): void {
    if (this.page() > 1 && !this.loading()) this.loadPage(this.page() - 1);
  }

  nextPage(): void {
    const result = this.history();
    if (result && this.page() * result.pageSize < result.totalCount && !this.loading()) {
      this.loadPage(this.page() + 1);
    }
  }

  firstVisibleRow(): number {
    return this.history()?.items.length ? (this.page() - 1) * this.pageSize + 1 : 0;
  }

  lastVisibleRow(): number {
    const result = this.history();
    return result ? Math.min(this.page() * result.pageSize, result.totalCount) : 0;
  }

  totalPages(): number {
    const result = this.history();
    return result ? Math.ceil(result.totalCount / result.pageSize) : 0;
  }

  async deleteImport(item: WorkbookImportHistoryItem): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: 'Delete imported workbook?',
      message: `Delete the import “${item.displayName || item.fileName}”? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;

    this.deleteError.set(null);
    this.deletingId.set(item.id);
    this.billing.deleteImport(item.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.notifications.success('Imported workbook deleted.');
        this.loadPage(this.page());
      },
      error: (failure: unknown) => {
        this.deletingId.set(null);
        const deleteError = this.readDeleteError(failure);
        this.deleteError.set(deleteError);
        this.notifications.error(deleteError.message);
      },
    });
  }

  private readDeleteError(error: unknown): ImportDeleteError {
    const fallback = 'Could not delete the imported workbook. Please try again.';
    if (!(error instanceof HttpErrorResponse) || typeof error.error !== 'object' || error.error === null) {
      return { message: fallback };
    }

    const body = error.error as Record<string, unknown>;
    return {
      message: typeof body.message === 'string' ? body.message : fallback,
      importId: typeof body.importId === 'string' ? body.importId : undefined,
      calculatedAt: typeof body.calculatedAt === 'string' ? body.calculatedAt : undefined,
    };
  }
}
