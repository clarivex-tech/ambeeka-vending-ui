import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'vpa-weekly-billing-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="billing-nav" aria-label="Weekly Billing pages">
      <a routerLink="/admin/weekly-billing" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page">Overview</a>
      <a routerLink="/admin/weekly-billing/import" routerLinkActive="active" ariaCurrentWhenActive="page">Import &amp; Processing</a>
      <a routerLink="/admin/weekly-billing/imports" routerLinkActive="active" ariaCurrentWhenActive="page">Import History</a>
      <a routerLink="/admin/weekly-billing/pos-cleanup" routerLinkActive="active" ariaCurrentWhenActive="page">POS Cleanup</a>
      <a routerLink="/admin/weekly-billing/employer-rules" routerLinkActive="active" ariaCurrentWhenActive="page">Employer Rules</a>
    </nav>
  `,
  styles: [`
    .billing-nav { display: flex; flex-wrap: wrap; gap: var(--spacing-md, 1rem); border-bottom: 1px solid var(--color-border, #ddd); }
    .billing-nav a { padding: var(--spacing-sm, 0.5rem) var(--spacing-xs, 0.25rem); border-bottom: 2px solid transparent; color: var(--color-text-muted, #666); text-decoration: none; }
    .billing-nav a.active { border-bottom-color: var(--color-primary, #2563eb); color: var(--color-primary, #2563eb); font-weight: 600; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyBillingNavComponent {}
