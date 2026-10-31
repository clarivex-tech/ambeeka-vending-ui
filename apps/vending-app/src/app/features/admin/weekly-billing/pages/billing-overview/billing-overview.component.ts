import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { WeeklyBillingNavComponent } from '../../components/weekly-billing-nav/weekly-billing-nav.component';
import { BillingCalculationHistoryPage, BillingCalculationResponse } from '../../models/weekly-billing.model';
import { WeeklyBillingService } from '../../services/weekly-billing.service';

@Component({
  selector: 'vpa-billing-overview',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink, ButtonModule, WeeklyBillingNavComponent],
  templateUrl: './billing-overview.component.html',
  styleUrl: './billing-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingOverviewComponent implements OnInit {
  private readonly billing = inject(WeeklyBillingService);

  readonly pageSize = 20;
  readonly page = signal(1);
  readonly history = signal<BillingCalculationHistoryPage | null>(null);
  readonly calculationId = signal('');
  readonly calculation = signal<BillingCalculationResponse | null>(null);
  readonly historyLoading = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.historyLoading.set(true);
    this.error.set(null);
    this.billing.getCalculationHistory(page, this.pageSize).subscribe({
      next: (result) => {
        if (result.items.length === 0 && result.page > 1 && result.totalCount > 0) {
          this.loadPage(result.page - 1);
          return;
        }
        this.history.set(result);
        this.page.set(result.page);
        this.historyLoading.set(false);
        const selectedId = result.items.some((item) => item.id === this.calculationId())
          ? this.calculationId()
          : result.items[0]?.id ?? '';
        this.calculationId.set(selectedId);
        if (selectedId) this.fetchPreview(selectedId);
        else {
          this.calculation.set(null);
          this.loading.set(false);
        }
      },
      error: () => {
        this.error.set('Could not load saved calculations. Please try again.');
        this.historyLoading.set(false);
      },
    });
  }

  selectCalculation(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.calculationId.set(id);
    this.error.set(null);
    if (id) this.fetchPreview(id);
    else {
      this.calculation.set(null);
      this.loading.set(false);
    }
  }

  previousPage(): void {
    if (this.page() > 1 && !this.historyLoading()) this.loadPage(this.page() - 1);
  }

  nextPage(): void {
    const result = this.history();
    if (result && this.page() * result.pageSize < result.totalCount && !this.historyLoading()) {
      this.loadPage(this.page() + 1);
    }
  }

  totalPages(): number {
    const result = this.history();
    return result ? Math.ceil(result.totalCount / result.pageSize) : 0;
  }

  private fetchPreview(id: string): void {
    this.calculation.set(null);
    this.loading.set(true);
    this.billing.getCalculationPreview(id).subscribe({
      next: (calculation) => {
        this.calculation.set(calculation);
        this.calculationId.set(calculation.id);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not retrieve that saved billing snapshot.');
        this.loading.set(false);
      },
    });
  }
}
