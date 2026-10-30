import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'pricing',
      },
      {
        path: 'pricing',
        loadChildren: () =>
          import('./pricing/pricing.routes').then((m) => m.PRICING_ROUTES),
      },
    ],
  },
];
