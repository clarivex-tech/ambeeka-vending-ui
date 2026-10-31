import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { WeeklyBillingNavComponent } from '../../components/weekly-billing-nav/weekly-billing-nav.component';
import { BillingCalculationResponse } from '../../models/weekly-billing.model';
import { WeeklyBillingService } from '../../services/weekly-billing.service';

@Component({
  selector: 'vpa-billing-overview',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink, ButtonModule, WeeklyBillingNavComponent],
  templateUrl: './billing-overview.component.html',
  styleUrl: './billing-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingOverviewComponent {
  private readonly billing = inject(WeeklyBillingService);

  readonly calculationId = signal('');
  readonly calculation = signal<BillingCalculationResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadSavedPreview(): void {
    const id = this.calculationId().trim();
    if (!id) {
      this.error.set('Enter a calculation ID to load a saved preview.');
      return;
    }
    this.error.set(null);
    this.calculation.set(null);
    this.loading.set(true);
    this.fetchPreview(id);
  }

  setCalculationId(event: Event): void {
    this.calculationId.set((event.target as HTMLInputElement).value);
  }

  private fetchPreview(id: string): void {
    this.billing.getCalculationPreview(id).subscribe({
      next: (calculation) => {
        this.calculation.set(calculation);
        this.calculationId.set(calculation.id);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not retrieve that saved billing preview.');
        this.loading.set(false);
      },
    });
  }
}
