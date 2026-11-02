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

import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';


import { appRoutes } from './app.routes';
import { GlobalErrorHandler } from './core/handlers/global-error-handler';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { correlationInterceptor } from './core/interceptors/correlation.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { retryInterceptor } from './core/interceptors/retry.interceptor';

const AmbeekaAura = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e5f5f2',
      100: '#cce8e4',
      200: '#a2d4ce',
      300: '#78bfb7',
      400: '#378c84',
      500: '#00685f',
      600: '#005c54',
      700: '#00524c',
      800: '#003f3a',
      900: '#002d29',
      950: '#001d1a',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
        formField: { hoverBorderColor: '{primary.color}' },
      },
      dark: {
        primary: {
          color: '#70d2c6',
          contrastColor: '#102126',
          hoverColor: '#91e0d7',
          activeColor: '#aae9e1',
        },
        formField: { hoverBorderColor: '{primary.color}' },
      },
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.color}',
      offset: '2px',
    },
  },
});

/**
 * Application-wide configuration.
 *
 * HORIZONTAL (do not modify):
 *   - Error handling, HTTP interceptors, animations, routing strategy
 *
 * VERTICAL (extend as needed):
 *   - Add feature-specific providers below the horizontal providers
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // --- Horizontal providers (managed by platform team) ---
    provideRouter(appRoutes, withViewTransitions()),
    provideHttpClient(
      withInterceptors([correlationInterceptor, authInterceptor, retryInterceptor, loadingInterceptor, errorInterceptor])
    ),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: AmbeekaAura,
      }
    }),

    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    // --- Vertical providers (add your feature providers below) ---
  ],
};
