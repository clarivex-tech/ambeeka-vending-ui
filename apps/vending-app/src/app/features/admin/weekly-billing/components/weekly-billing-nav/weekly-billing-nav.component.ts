import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'vpa-weekly-billing-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="billing-nav" aria-label="Weekly Billing pages">
      <a routerLink="/admin/weekly-billing" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page">Weekly Summary</a>
      <a routerLink="/admin/weekly-billing/import" routerLinkActive="active" ariaCurrentWhenActive="page">Import &amp; Processing</a>
      <a routerLink="/admin/weekly-billing/imports" routerLinkActive="active" ariaCurrentWhenActive="page">Import History</a>
      <a routerLink="/admin/weekly-billing/pos-cleanup" routerLinkActive="active" ariaCurrentWhenActive="page">POS Cleanup</a>
      <a routerLink="/admin/weekly-billing/employer-rules" routerLinkActive="active" ariaCurrentWhenActive="page">Employer Rules</a>
    </nav>
  `,
  styles: [`
    .billing-nav { display: flex; flex-wrap: nowrap; gap: 0.25rem; overflow-x: auto; border-bottom: 1px solid var(--color-border, #dce5e8); scrollbar-width: thin; }
    .billing-nav a { flex: 0 0 auto; padding: 0.7rem 0.9rem; border-bottom: 3px solid transparent; color: var(--color-text-muted, #60727b); text-decoration: none; font-weight: 600; white-space: nowrap; transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease; }
    .billing-nav a:hover { color: var(--color-primary, #00685f); background: var(--color-primary-light, #e5f5f2); }
    .billing-nav a.active { border-bottom-color: var(--color-primary, #00685f); color: var(--color-primary, #00685f); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyBillingNavComponent {}
