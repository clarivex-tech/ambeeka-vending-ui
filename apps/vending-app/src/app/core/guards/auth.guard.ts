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

import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';

import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * HORIZONTAL: Route guard that prevents unauthenticated access.
 * Redirects to /login if the user has no valid token.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  const router = inject(Router);


  if (auth.isAuthenticated()) {
    return true;
  }


  router.navigate(['/login']);

  return false;
};
