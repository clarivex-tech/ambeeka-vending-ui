# vending-app

> Angular 21 monolith for the **vending** vertical — scaffolded by [Pervaxis Forge](https://github.com/clarivex-tech/pervaxis-forge), Clarivex Technologies.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Infrastructure (Horizontal)](#core-infrastructure-horizontal)
- [Shared Library](#shared-library)
- [Feature Development (Vertical)](#feature-development-vertical)
- [Styling System](#styling-system)
- [Environment Configuration](#environment-configuration)
- [Build & Deployment](#build--deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Known Issues & Gotchas](#known-issues--gotchas)
- [What Still Needs Wiring Up](#what-still-needs-wiring-up)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ (24.x tested) |
| npm | 10+ (11.x tested) |
| Angular CLI | 21.x (local — see [gotchas](#known-issues--gotchas)) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4200)
npm start

# Run unit tests
npm test

# Lint
npm run lint
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Development server at `http://localhost:4200` |
| `npm run build` | Production build to `dist/vending-app` |
| `npm run build:prod` | Alias for production build with optimizations |
| `npm test` | Run Karma/Jasmine unit tests |
| `npm run lint` | ESLint across all `.ts` and `.html` files |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Angular (standalone, no NgModules) | 21.x |
| UI Component Library | PrimeNG | 21.x |
| Theme | PrimeNG Aura (`@primeng/themes`) | 21.x |
| Icons | PrimeIcons | 7.x |
| Reactive primitives | Angular Signals + RxJS | Signals native, RxJS 7.8 |
| Language | TypeScript (strict mode) | ~5.9 |
| Styling | SCSS + CSS custom properties (design tokens) | — |
| Testing | Karma + Jasmine | Karma 6.4, Jasmine 5.4 |
| Linting | ESLint 9 + angular-eslint + typescript-eslint | 9.x / 21.x / 8.x |
| Build | `@angular/build` via `@angular-devkit/build-angular` | 21.x |
| Mobile (future) | Capacitor (config present, not yet active) | — |
| Runtime | Browser (SPA) + Docker/nginx for production | — |

---

## Architecture Overview

### Standalone Architecture

No NgModules anywhere. Every component, directive, and pipe declares its own `imports` array. This gives fine-grained tree-shaking and easier lazy loading.

### Horizontal vs Vertical

The codebase uses a two-tier model:

- **Horizontal** — platform-level infrastructure owned by the platform team. Lives in `core/` and `app.*`. Do not modify these files without platform team sign-off.
- **Vertical** — business feature code. Lives in `features/`. This is where your team works.

### Routing

- All feature routes are lazy-loaded via `loadComponent` / `loadChildren`
- `authGuard` enforces authentication on every protected route
- `permissionGuard(permission)` factory for fine-grained RBAC
- Wildcard `**` redirects to `/not-found`

### State Management

Signals-first. No NgRx, no BehaviorSubjects for global state. Angular Signals are used in:
- `LoadingService` — active request counter
- `NotificationService` — toast queue
- `AuthService` — token state
- `ConfirmDialogService` — active dialog state

RxJS is used only where Observables are the right fit (HTTP, router events).

---

## Project Structure

```
vending-app/
├── apps/
│   └── vending-app/
│       └── src/
│           ├── app/
│           │   ├── core/                    # Platform-owned (do not modify)
│           │   │   ├── guards/
│           │   │   │   ├── auth.guard.ts           # Redirects to /login if unauthenticated
│           │   │   │   └── permission.guard.ts     # RBAC guard factory
│           │   │   ├── handlers/
│           │   │   │   └── global-error-handler.ts # Catches all unhandled exceptions
│           │   │   ├── interceptors/
│           │   │   │   ├── auth.interceptor.ts     # Attaches Bearer token to API requests
│           │   │   │   ├── correlation.interceptor.ts # X-Correlation-Id on every request
│           │   │   │   ├── error.interceptor.ts    # 401/403/5xx response handling
│           │   │   │   ├── loading.interceptor.ts  # Auto show/hide global loading bar
│           │   │   │   └── retry.interceptor.ts    # 2x retry with backoff on 5xx/network
│           │   │   └── services/
│           │   │       ├── api.service.ts          # Base HTTP service (use this, not HttpClient)
│           │   │       ├── auth.service.ts         # Token management, isAuthenticated signal
│           │   │       ├── auth-sync.service.ts    # Cross-tab logout via BroadcastChannel
│           │   │       ├── error-reporter.ts       # Pluggable error reporting (Sentry etc.)
│           │   │       ├── inactivity.service.ts   # 15-min auto-logout on inactivity
│           │   │       ├── loading.service.ts      # Global loading indicator state
│           │   │       ├── logger.service.ts       # Structured logging, env-aware levels
│           │   │       ├── notification.service.ts # Toast notifications API
│           │   │       ├── platform.service.ts     # Platform detection (stub)
│           │   │       └── route-loading.service.ts # Loading bar during route transitions
│           │   ├── features/                # Your code lives here
│           │   │   ├── _reference/          # Copy-paste template for new features
│           │   │   ├── dashboard/           # Placeholder dashboard (replace me)
│           │   │   ├── login/               # Auth placeholder (wire up your IdP)
│           │   │   └── not-found/           # 404 page
│           │   ├── shared/                  # Reusable cross-feature code
│           │   │   ├── components/
│           │   │   │   ├── empty-state/     # EmptyStateComponent
│           │   │   │   └── skeleton-loader/ # SkeletonLoaderComponent
│           │   │   ├── models/
│           │   │   │   └── pagination.model.ts  # PaginatedResponse<T>, PaginationParams
│           │   │   ├── services/
│           │   │   │   └── confirm-dialog.service.ts # Promise-based confirm dialogs
│           │   │   ├── utils/
│           │   │   │   └── form-errors.ts   # getFormFieldError() for reactive forms
│           │   │   └── index.ts             # Barrel — import from '@shared'
│           │   ├── app.component.ts         # App shell (header, sidebar, toasts, dialogs)
│           │   ├── app.config.ts            # Providers: router, HTTP, PrimeNG, ErrorHandler
│           │   └── app.routes.ts            # Root route definitions
│           ├── environments/
│           │   ├── environment.ts           # Dev: apiUrl = http://localhost:3000
│           │   └── environment.prod.ts      # Prod: apiUrl = /api
│           ├── index.html                   # CSP meta tag, vpa-root host
│           ├── main.ts                      # bootstrapApplication entry
│           └── styles.scss                  # Global reset + design tokens
├── angular.json                             # Build configuration
├── tsconfig.json                            # Strict TS config + path aliases
├── eslint.config.mjs                        # Flat ESLint config
├── Dockerfile                               # Multi-stage build (node → nginx)
├── nginx.conf                               # nginx SPA routing config
└── package.json
```

---

## Core Infrastructure (Horizontal)

These are pre-wired and active. You get all of this for free.

### HTTP Interceptor Pipeline

Every outgoing HTTP request passes through this chain (in order):

```
correlationInterceptor → authInterceptor → retryInterceptor → loadingInterceptor → errorInterceptor
```

| Interceptor | What it does |
|-------------|-------------|
| `correlationInterceptor` | Adds `X-Correlation-Id: <uuid>` to every request for end-to-end tracing |
| `authInterceptor` | Attaches `Authorization: Bearer <token>` to requests targeting `environment.apiUrl` |
| `retryInterceptor` | 30s timeout; retries up to 2x on 5xx/network errors with 1s backoff. Never retries 4xx. |
| `loadingInterceptor` | Calls `LoadingService.show()` / `hide()` — drives the top loading bar automatically |
| `errorInterceptor` | 401 → logout; 403 → log warning; 5xx → log error. Always re-throws for component handling. |

### Authentication (`AuthService`)

- Tokens stored in `sessionStorage` (clears on tab close)
- `isAuthenticated` — computed Signal, checks token expiry
- `accessToken` — computed Signal, null if not authenticated
- `setTokens(tokens)` — call this after successful IdP login
- `logout()` — clears storage, navigates to `/login`
- `refreshToken()` — **stub, needs your IdP implementation**
- `hasPermission(permission)` — **stub, needs JWT claims decoding**

### Cross-Tab Auth Sync (`AuthSyncService`)

Uses `BroadcastChannel` — when a user logs out in one browser tab, all other open tabs log out automatically. No setup needed; initialized in `AppComponent`.

### Inactivity Auto-Logout (`InactivityService`)

Listens for `mousedown`, `keydown`, `touchstart`, `scroll`. Logs the user out after **15 minutes** of inactivity. Timer resets on any interaction. Configured via `INACTIVITY_TIMEOUT_MS` constant.

### Global Error Handler

Catches all unhandled Angular exceptions. Logs via `LoggerService` and forwards to `ErrorReporter` (pluggable — add Sentry/Datadog here).

### Logger (`LoggerService`)

Environment-aware log suppression:
- Development: `debug`, `info`, `warn`, `error` all output
- Production: only `warn` and `error` output

### Route Guards

```typescript
// Authentication — redirect to /login if no valid token
canActivate: [authGuard]

// Permission — check JWT claim/role
canActivate: [permissionGuard('orders:read')]
```

---

## Shared Library

Import from the `@shared` path alias:

```typescript
import { EmptyStateComponent, SkeletonLoaderComponent, getFormFieldError } from '@shared';
import { ConfirmDialogService, PaginatedResponse } from '@shared';
```

| Export | Description |
|--------|-------------|
| `EmptyStateComponent` | Empty state placeholder with icon, title, message |
| `SkeletonLoaderComponent` | Animated skeleton with configurable lines and avatar |
| `ConfirmDialogService` | Promise-based confirm dialogs (`await confirm.open({...})`) |
| `getFormFieldError(control, label)` | Human-readable reactive form validation messages |
| `PaginatedResponse<T>` | Standard paginated API response shape |
| `PaginationParams` | Standard pagination request params |
| `buildPaginationParams(...)` | Builds query string params for paginated API calls |
| `NgOptimizedImage` | Angular's optimized image directive (re-exported for convenience) |

---

## Feature Development (Vertical)

### Creating a New Feature

1. Copy the reference module:
   ```
   cp -r src/app/features/_reference src/app/features/your-domain
   ```

2. Rename `sample` → `your-domain` throughout (classes, filenames, constants)

3. Update the model in `models/your-domain.model.ts` to match your API contract

4. Register in `app.routes.ts`:
   ```typescript
   {
     path: 'your-domain',
     canActivate: [authGuard],
     loadChildren: () =>
       import('./features/your-domain/routes/your-domain.routes')
         .then(m => m.YOUR_DOMAIN_ROUTES),
   }
   ```

5. Add a nav item in `app.component.ts` → `menuItems`

### Feature Folder Convention

```
features/your-domain/
├── constants/          # API paths, route paths, permission keys
├── models/             # Interfaces and DTOs
├── services/           # API service (uses ApiService, never HttpClient directly)
├── pages/              # Routable page components (list, detail, form)
├── components/         # Presentational components (optional)
├── mocks/              # Dev-only mock interceptor
├── routes/             # Route definitions
└── index.ts            # Barrel exports (public API of the feature)
```

### API Service Pattern

```typescript
import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services/api.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  getAll()              { return this.api.get<Product[]>('/products'); }
  getById(id: number)   { return this.api.get<Product>(`/products/${id}`); }
  create(dto: CreateProductDto) { return this.api.post<Product>('/products', dto); }
  update(id: number, dto: UpdateProductDto) { return this.api.put<Product>(`/products/${id}`, dto); }
  delete(id: number)    { return this.api.delete<void>(`/products/${id}`); }
}
```

### Mock Interceptor Pattern (dev only)

The `_reference/mocks/sample-mock.interceptor.ts` shows how to wire up in-memory mock data so you can build UI before the backend is ready. Register it temporarily in `app.config.ts` and remove before going to production.

---

## Styling System

Global design tokens are defined in `styles.scss` as CSS custom properties. **Never hardcode colors or spacing.**

```scss
.my-component {
  padding: var(--spacing-lg);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
```

### Available Tokens

| Category | Tokens |
|----------|--------|
| Spacing | `--spacing-xs` (0.25rem) · `--spacing-sm` · `--spacing-md` · `--spacing-lg` · `--spacing-xl` · `--spacing-2xl` (3rem) |
| Colors | `--color-primary` · `--color-primary-dark` · `--color-secondary` · `--color-success` · `--color-warning` · `--color-danger` |
| Surfaces | `--color-bg` · `--color-surface` · `--color-border` · `--color-text` · `--color-text-muted` |
| Radius | `--radius-sm` · `--radius-md` · `--radius-lg` · `--radius-full` |
| Shadows | `--shadow-sm` · `--shadow-md` · `--shadow-lg` |
| Typography | `--font-family-base` · `--font-family-mono` |

Dark mode is supported automatically via `@media (prefers-color-scheme: dark)`. All tokens remap — no extra work needed in components.

PrimeNG dark mode is toggled by adding the `.dark-mode` class to the document root.

---

## Environment Configuration

| File | Used when | `apiUrl` |
|------|-----------|----------|
| `environment.ts` | `ng serve` (development) | `http://localhost:3000` |
| `environment.prod.ts` | `ng build --configuration production` | `/api` |

**To point production at a real backend**, update `apiUrl` in `environment.prod.ts`. This is the only change needed — the `authInterceptor` and `ApiService` pick it up automatically.

---

## Build & Deployment

### Development

```bash
npm start
# → http://localhost:4200 with hot reload
```

### Production Build

```bash
npm run build:prod
# → dist/vending-app/browser/
```

Output is a static SPA. The nginx config in `nginx.conf` handles SPA routing (all paths return `index.html`).

### Docker

```bash
docker build -t vending-app .
docker run -p 80:80 vending-app
```

The `Dockerfile` is a two-stage build:
1. `node:20-alpine` — installs deps and runs `ng build --configuration production`
2. `nginx:alpine` — serves the static output on port 80

### Bundle Sizes (production, current baseline)

| Bundle | Raw size | Gzipped |
|--------|----------|---------|
| Initial total | ~657 kB | ~150 kB |
| login (lazy) | ~31 kB | ~7 kB |
| dashboard (lazy) | ~0.6 kB | — |

Budget thresholds: **1 MB warning / 2 MB error** (initial chunk). PrimeNG is the main driver of initial size; it will grow as you import more components.

---

## CI/CD Pipeline

GitHub Actions at `.github/workflows/ci.yml`. Triggers on push/PR to `main` and `develop`.

```
Install deps → Lint → Test (with coverage) → Production build
```

All three gates must pass for a PR to merge.

---

## Known Issues & Gotchas

### Always use the local Angular CLI

The globally installed `ng` may be a different version and will fail with:
> `Could not find the implementation for builder @angular-devkit/build-angular:application`

Always run via npm scripts (`npm run build`, `npm run lint`) or explicitly via:
```bash
node_modules/.bin/ng <command>
```

### Missing devDependencies (fixed)

The original scaffold was missing `typescript-eslint` and `angular-eslint` from `package.json` — both are imported in `eslint.config.mjs`. These have been added and are now in `package.json`.

### `platform.service.ts` is a stub

`core/services/platform.service.ts` exists but is currently empty. It's a placeholder for Capacitor/web platform detection. Add your platform detection logic there when targeting mobile.

---

## What Still Needs Wiring Up

These are intentional stubs — the scaffold sets the contract, your team implements the integration.

| What | File | Notes |
|------|------|-------|
| IdP Login | `features/login/login.component.ts` | Replace mock tokens with Cognito / Auth0 / Azure AD call |
| Token Refresh | `core/services/auth.service.ts` → `refreshToken()` | Call your IdP's token refresh endpoint |
| Permission Claims | `core/services/auth.service.ts` → `hasPermission()` | Decode JWT claims / check roles from IdP |
| Error Reporting | `core/services/error-reporter.ts` → `report()` | Add Sentry, Datadog RUM, or CloudWatch |
| Production API URL | `environments/environment.prod.ts` | Set `apiUrl` to your actual backend |
| Navigation | `app.component.ts` → `menuItems` | Add sidebar links as you build features |

---

*Scaffolded by Pervaxis Forge — Clarivex Technologies*
