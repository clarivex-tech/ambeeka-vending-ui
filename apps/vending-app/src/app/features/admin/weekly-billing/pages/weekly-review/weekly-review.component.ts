import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmDialogService } from '../../../../../shared/services/confirm-dialog.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { WeeklyBillingNavComponent } from '../../components/weekly-billing-nav/weekly-billing-nav.component';
import {
  EditableFieldDefinition,
  ManualCorrection,
  WeeklyReview,
} from '../../models/weekly-billing.model';
import { WeeklyBillingService } from '../../services/weekly-billing.service';

@Component({
  selector: 'vpa-weekly-review',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, ButtonModule, TableModule, WeeklyBillingNavComponent],
  templateUrl: './weekly-review.component.html',
  styleUrl: './weekly-review.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyReviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly billing = inject(WeeklyBillingService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly notifications = inject(NotificationService);

  readonly weekId = this.route.snapshot.paramMap.get('weekId') ?? '';
  readonly review = signal<WeeklyReview | null>(null);
  readonly loading = signal(true);
  readonly recalculating = signal(false);
  readonly savingCorrection = signal(false);
  readonly error = signal<string | null>(null);
  readonly correctionEditorOpen = signal(false);
  readonly editingCorrectionId = signal<string | null>(null);
  readonly correctionTransactionId = signal('');
  readonly correctionReason = signal('');
  readonly correctionValues = signal<Record<string, string | number | boolean>>({});

  ngOnInit(): void {
    this.loadReview();
  }

  loadReview(): void {
    this.loading.set(true);
    this.error.set(null);
    this.billing.getWeeklyReview(this.weekId).subscribe({
      next: (review) => {
        this.review.set(review);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load this weekly review.');
        this.loading.set(false);
      },
    });
  }

  openCorrection(correction?: ManualCorrection): void {
    const fields = this.review()?.correctionFields ?? [];
    if (fields.length === 0) {
      this.error.set('The API has not supplied the editable correction fields yet.');
      return;
    }

    this.editingCorrectionId.set(correction?.id ?? null);
    this.correctionTransactionId.set(correction?.transactionId ?? '');
    this.correctionReason.set(correction?.reason ?? '');
    const values: Record<string, string | number | boolean> = {};
    for (const field of fields) values[field.key] = correction?.changes[field.key] ?? this.defaultValue(field);
    this.correctionValues.set(values);
    this.correctionEditorOpen.set(true);
    this.error.set(null);
  }

  closeCorrection(): void {
    this.correctionEditorOpen.set(false);
    this.editingCorrectionId.set(null);
  }

  setTransactionId(event: Event): void {
    this.correctionTransactionId.set((event.target as HTMLInputElement).value);
  }

  setReason(event: Event): void {
    this.correctionReason.set((event.target as HTMLTextAreaElement).value);
  }

  setCorrectionValue(field: EditableFieldDefinition, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = field.type === 'boolean'
      ? input.checked
      : field.type === 'number'
        ? (input.value === '' ? '' : Number(input.value))
        : input.value;
    this.correctionValues.update((values) => ({ ...values, [field.key]: value }));
  }

  saveCorrection(): void {
    const transactionId = this.correctionTransactionId().trim();
    const reason = this.correctionReason().trim();
    const changes = this.correctionValues();
    if (!transactionId || !reason || Object.keys(changes).length === 0) {
      this.error.set('Enter a transaction ID, a reason, and at least one correction value.');
      return;
    }

    this.savingCorrection.set(true);
    const request = { transactionId, reason, changes };
    const correctionId = this.editingCorrectionId();
    const save = correctionId
      ? this.billing.updateCorrection(this.weekId, correctionId, request)
      : this.billing.createCorrection(this.weekId, request);

    save.subscribe({
      next: () => {
        this.savingCorrection.set(false);
        this.closeCorrection();
        this.recalculate();
      },
      error: () => {
        this.savingCorrection.set(false);
        this.error.set('Could not save the correction.');
      },
    });
  }

  async deleteCorrection(correction: ManualCorrection): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: 'Delete manual correction?',
      message: `Delete the correction for transaction ${correction.transactionId}?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;

    this.billing.deleteCorrection(this.weekId, correction.id).subscribe({
      next: () => this.recalculate(),
      error: () => this.error.set('Could not delete the correction.'),
    });
  }

  private recalculate(): void {
    this.recalculating.set(true);
    this.error.set(null);
    this.billing.recalculateWeek(this.weekId).subscribe({
      next: (review) => {
        this.review.set(review);
        this.recalculating.set(false);
        this.notifications.success('Weekly and monthly totals were recalculated.');
      },
      error: () => {
        this.recalculating.set(false);
        this.error.set('The correction was saved, but recalculation failed. Retry the review refresh.');
      },
    });
  }

  private defaultValue(field: EditableFieldDefinition): string | number | boolean {
    if (field.type === 'boolean') return false;
    return '';
  }
}
