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

  readonly month = signal(this.currentMonth());
  readonly employers = ['Warren Valve'];
  readonly employer = signal(this.employers[0]);
  readonly calculationId = signal('');
  readonly calculation = signal<BillingCalculationResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  setMonth(event: Event): void {
    this.month.set((event.target as HTMLInputElement).value);
  }

  setEmployer(event: Event): void {
    this.employer.set((event.target as HTMLSelectElement).value);
  }

  calculate(): void {
    const month = this.month();
    const employer = this.employer().trim();
    if (!month || !employer) {
      this.error.set('Choose a month and enter the exact POS MachineName for the employer.');
      return;
    }

    this.calculation.set(null);
    this.error.set(null);
    this.loading.set(true);
    this.billing.createCalculationPreview(month, employer).subscribe({
      next: (preview) => {
        if (!preview.id) {
          this.loading.set(false);
          this.error.set('The API created a preview but did not return its calculation ID.');
          return;
        }
        this.calculationId.set(preview.id);
        this.calculation.set(preview);
        this.employer.set(preview.employerName);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not calculate the billing preview. Check the month and exact POS MachineName, then try again.');
      },
    });
  }

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
        this.employer.set(calculation.employerName);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not retrieve that saved billing preview.');
        this.loading.set(false);
      },
    });
  }

  private currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
