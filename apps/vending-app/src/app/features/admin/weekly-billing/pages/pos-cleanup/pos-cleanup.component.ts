import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { NotificationService } from '../../../../../core/services/notification.service';
import { WeeklyBillingNavComponent } from '../../components/weekly-billing-nav/weekly-billing-nav.component';
import { POS_CLEANUP_CONFIRMATION_PHRASE } from '../../constants/weekly-billing.constants';
import { PosBillingCleanupCounts, PosBillingCleanupPreview, PosBillingCleanupResult } from '../../models/weekly-billing.model';
import { WeeklyBillingService } from '../../services/weekly-billing.service';

@Component({
  selector: 'vpa-pos-cleanup',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ButtonModule, WeeklyBillingNavComponent],
  templateUrl: './pos-cleanup.component.html',
  styleUrl: './pos-cleanup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosCleanupComponent implements OnInit {
  private readonly billing = inject(WeeklyBillingService);
  private readonly notifications = inject(NotificationService);

  readonly preview = signal<PosBillingCleanupPreview | null>(null);
  readonly cleanupResult = signal<PosBillingCleanupResult | null>(null);
  readonly confirmation = signal('');
  readonly loading = signal(false);
  readonly cleaning = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPreview();
  }

  loadPreview(): void {
    this.loading.set(true);
    this.error.set(null);
    this.billing.getPosBillingCleanupPreview().subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        this.error.set(this.errorMessage(failure, 'Could not load the POS billing cleanup preview.'));
        this.loading.set(false);
      },
    });
  }

  setConfirmation(event: Event): void {
    this.confirmation.set((event.target as HTMLInputElement).value);
  }

  expectedPhrase(): string {
    return this.preview()?.confirmationPhrase || POS_CLEANUP_CONFIRMATION_PHRASE;
  }

  hasRecordsToDelete(): boolean {
    const counts = this.preview()?.recordsToDelete;
    return !!counts && Object.values(counts).some((count) => typeof count === 'number' && count > 0);
  }

  canClean(): boolean {
    return !this.loading() && !this.cleaning() && this.hasRecordsToDelete()
      && this.confirmation() === this.expectedPhrase();
  }

  countEntries(counts: PosBillingCleanupCounts | null | undefined): Array<{ label: string; value: number }> {
    return [
      { label: 'Calculations', value: counts?.calculations ?? 0 },
      { label: 'Calculation import links', value: counts?.calculationImportLinks ?? 0 },
      { label: 'Imports', value: counts?.imports ?? 0 },
      { label: 'Transactions', value: counts?.transactions ?? 0 },
    ];
  }

  runCleanup(): void {
    if (!this.canClean()) return;
    this.error.set(null);
    this.cleaning.set(true);
    this.billing.cleanPosBillingData(this.confirmation()).subscribe({
      next: (result) => {
        this.cleanupResult.set(result);
        this.confirmation.set('');
        this.cleaning.set(false);
        this.notifications.success('POS billing cleanup completed.');
        this.loadPreview();
      },
      error: (failure: unknown) => {
        this.error.set(this.errorMessage(failure, 'POS billing cleanup failed. No completion was reported by the API.'));
        this.cleaning.set(false);
      },
    });
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse) || typeof error.error !== 'object' || error.error === null) return fallback;
    const body = error.error as Record<string, unknown>;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.detail === 'string') return body.detail;
    if (typeof body.title === 'string') return body.title;
    return fallback;
  }
}
