# vending-app — Technical Specification

## Service Identity

| Property | Value |
|----------|-------|
| Service Name | `vending-app` |
| Service Type | Monolithic Angular Application |
| Component Prefix | `vpa` |
| Target Platforms |  |
| Product | vpa |
| Vertical | vending |

## Architecture Decisions

### Standalone Architecture

This project uses Angular 21 standalone components — no NgModules. All components, directives, and pipes declare their dependencies via the `imports` array in their `@Component` decorator.

### Folder Structure

- `core/` — Singleton services, guards, interceptors, and handlers. Provided at root level.
- `features/` — Lazy-loaded feature areas. Each feature is a self-contained folder with its own routes, components, and services.
- `shared/` — Reusable components, directives, and pipes used across multiple features.

### Routing Strategy

- Lazy-loaded feature routes via `loadComponent` / `loadChildren`
- Route guards for authentication enforcement
- Wildcard catch-all for unmatched URLs

### Error Handling Strategy

- Global `ErrorHandler` captures unhandled exceptions
- HTTP `errorInterceptor` handles API response errors (401, 403, 5xx)
- Structured logging via `LoggerService` with environment-aware level suppression

### Security

- Content Security Policy via `<meta>` tag in `index.html`
- Auth interceptor attaches Bearer tokens to outgoing requests
- Route guards prevent unauthorized navigation

