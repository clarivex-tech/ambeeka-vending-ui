import { Routes } from '@angular/router';

export const PRICING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/pricing-list/pricing-list.component').then(
        (m) => m.PricingListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/pricing-form/pricing-form.component').then(
        (m) => m.PricingFormComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/pricing-form/pricing-form.component').then(
        (m) => m.PricingFormComponent,
      ),
  },
];
