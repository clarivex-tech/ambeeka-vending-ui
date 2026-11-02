import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BillingDashboardImport, BillingDashboardResponse, BillingDashboardWeek } from '../admin/weekly-billing/models/weekly-billing.model';
import { WeeklyBillingService } from '../admin/weekly-billing/services/weekly-billing.service';

@Component({
  selector: 'vpa-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, ButtonModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly billing = inject(WeeklyBillingService);

  readonly dashboard = signal<BillingDashboardResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.billing.getDashboard().subscribe({
      next: (result) => {
        this.dashboard.set(result);
        this.loading.set(false);
      },
      error: (failure: unknown) => {
        const message = typeof failure === 'object' && failure !== null
          ? (failure as { error?: { message?: unknown } }).error?.message
          : null;
        this.error.set(typeof message === 'string'
          ? message
          : 'Could not load the weekly settlement dashboard. Please try again.');
        this.loading.set(false);
      },
    });
  }

  maximumVends(): number {
    return (this.dashboard()?.weeklyChart ?? []).reduce(
      (maximum, week) => Math.max(maximum, week.countedVends),
      0,
    );
  }

  barHeight(week: BillingDashboardWeek): number {
    const max = this.maximumVends();
    return max > 0 ? Math.max(5, (week.countedVends / max) * 100) : 0;
  }

  importHasCalculation(item: BillingDashboardImport): boolean {
    return item.latestCalculationId !== null;
  }

  statusLabel(item: BillingDashboardImport): string {
    const status = this.importHasCalculation(item) ? item.calculationStatus : item.importStatus;
    const labels: Record<string, string> = {
      Validated: 'Validated',
      NeedsReview: 'Needs review',
      ReadyForReview: 'Ready for review',
      NotCalculated: 'Not calculated',
    };
    return labels[status] ?? status;
  }

  statusClass(item: BillingDashboardImport): string {
    const status = this.importHasCalculation(item) ? item.calculationStatus : item.importStatus;
    if (status === 'NeedsReview') return 'status-pill--review';
    if (status === 'NotCalculated') return 'status-pill--pending';
    return 'status-pill--complete';
  }

  weekLabel(week: BillingDashboardWeek): string {
    return `${this.formatWeekDate(week.weekStart)} – ${this.formatWeekDate(week.weekEnd)}`;
  }

  importWeekLabel(item: BillingDashboardImport): string {
    if (!item.posWeekStart || !item.posWeekEnd) return 'Week unavailable';
    return `${this.formatWeekDate(item.posWeekStart)} – ${this.formatWeekDate(item.posWeekEnd)}`;
  }

  private formatWeekDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
}
