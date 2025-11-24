# Security Architecture

This project uses a custom **Security Filter Chain** inspired by Spring Security to handle request authorization and security middleware.

## Overview

The security layer is located in `src/core/security`. It provides:

- **SecurityFilterChain**: Orchestrates security middleware.
- **HttpSecurityBuilder**: A fluent API to configure security rules.
- **Middleware**: Wrappers for standard security headers (Helmet), CORS, and Rate Limiting.

## Configuration

The security chain is configured in `src/infrastructure/httpServer.ts`:

```typescript
const securityFilterChain = new HttpSecurityBuilder()
  .addFilter(helmetMiddleware())
  .addFilter(corsMiddleware())
  .addFilter(rateLimitMiddleware())
  .authorizeHttpRequests((auth) => {
    auth.requestMatchers("/health").permitAll();
    auth.requestMatchers("/users").permitAll();
    // auth.requestMatchers("/admin").access(isAdmin);
  })
  .build();
```

## Features

### Helmet

Adds various HTTP headers to secure the app (X-XSS-Protection, X-Frame-Options, etc.).

### CORS

Configured to allow cross-origin requests. Customize the `corsMiddleware` wrapper to tighten rules.

### Rate Limiting

Limits repeated requests to public APIs. Default: 100 requests per 15 minutes per IP.

### Authorization

- `permitAll()`: Allows access to everyone.
- `authenticated()`: Requires authentication (checks `req.auth`).
- `access(predicate)`: Custom authorization logic using Predicates.

## Predicates

You can define custom security rules using **Predicates**:

```typescript
type Predicate = (req: Request) => boolean;

const isAdmin: Predicate = (req) => req.user?.role === 'ADMIN';

// Usage
.authorizeHttpRequests((auth) => {
  auth.requestMatchers("/admin/**").access(isAuthenticated, isAdmin);
})
```
