/**
 ************************************************************************
 * Copyright (C) 2026 Clarivex Technologies Private Limited
 * All Rights Reserved.
 *
 * NOTICE: All intellectual and technical concepts contained
 * herein are proprietary to Clarivex Technologies Private Limited
 * and may be covered by Indian and Foreign Patents,
 * patents in process, and are protected by trade secret or
 * copyright law. Dissemination of this information or reproduction
 * of this material is strictly forbidden unless prior written
 * permission is obtained from Clarivex Technologies Private Limited.
 *
 * Product:   Pervaxis Platform
 * Website:   https://clarivex.tech
 ************************************************************************
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

/**
 * Application routes.
 *
 * HORIZONTAL (do not modify):
 *   - Login route, auth guard enforcement, wildcard catch-all
 *
 * VERTICAL (extend here):
 *   - Add your feature routes in the marked section below
 *   - Use lazy loading: loadComponent / loadChildren
 *   - Apply authGuard to protected routes
 */
export const appRoutes: Routes = [
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/login/auth-callback.component').then(
        (m) => m.AuthCallbackComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },

  // --- VERTICAL: Add your feature routes here ---

  {
    path: 'admin',
    canActivate: [authGuard, permissionGuard('Admin')],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  {
    path: 'not-found',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
