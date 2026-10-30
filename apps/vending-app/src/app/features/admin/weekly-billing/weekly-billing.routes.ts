import { Routes } from '@angular/router';

export const WEEKLY_BILLING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/billing-overview/billing-overview.component').then(
        (m) => m.BillingOverviewComponent,
      ),
  },
  {
    path: 'import',
    loadComponent: () =>
      import('./pages/import-processing/import-processing.component').then(
        (m) => m.ImportProcessingComponent,
      ),
  },
  {
    path: 'imports',
    loadComponent: () =>
      import('./pages/import-history/import-history.component').then(
        (m) => m.ImportHistoryComponent,
      ),
  },
  {
    path: 'pos-cleanup',
    loadComponent: () =>
      import('./pages/pos-cleanup/pos-cleanup.component').then(
        (m) => m.PosCleanupComponent,
      ),
  },
  {
    path: 'weeks/:weekId',
    loadComponent: () =>
      import('./pages/weekly-review/weekly-review.component').then(
        (m) => m.WeeklyReviewComponent,
      ),
  },
  {
    path: 'employer-rules',
    loadComponent: () =>
      import('./pages/employer-rules/employer-rules.component').then(
        (m) => m.EmployerRulesComponent,
      ),
  },
];
