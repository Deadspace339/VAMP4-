# SOP: Security Hardening & Zero-Trust Policies (SWAG INC. VAMP 4)

## 1. Goal
Establish zero-trust deterministic security controls across backend API, frontend client, authentication flows, secret management, and external AI gateways.

## 2. Threat Model & Security Controls

### 2.1 Secrets & Environment Isolation
- **Rule**: Client-side bundles must NEVER contain third-party API keys or sensitive backend credentials.
- **Rule**: No secrets starting with `VITE_` except public client configuration.
- **Rule**: `JWT_SECRET` must be set via environment variable. If missing in development, an ephemeral cryptographically strong secret must be generated dynamically.
- **Rule**: Backend must load `.env` from secure locations using native `process.loadEnvFile`.

### 2.2 Authentication & Authorization
- **Founder Protection**: Handle `@macansssssssssss1337` cannot be registered without a cryptographically valid `FOUNDER_INVITE_CODE`. Unauthorized attempts return HTTP 403 Forbidden.
- **Role & Level Immutability**: Clients cannot alter their `role` or `level` via profile updates (`PUT /api/user/profile`). Roles are assigned during vetted registration or administrative commands. Levels are earned strictly by platform events.
- **Password Security**: Minimum 8 characters with alphanumeric requirements. Password hashing uses PBKDF2 with SHA-512 and 100,000 iterations. Legacy 10,000 iteration hashes are transparently migrated upon successful login.
- **Session Control**: Expired or invalid tokens trigger HTTP 401 with immediate client token purge.

### 2.3 API Gateway & Rate Limiting
- **Memory Safety**: In-memory rate limiting tables (`ipHits`, `loginAttempts`) must be bounded and periodically pruned every 5 minutes to prevent memory leak DoS attacks.
- **Reverse Proxy**: `app.set('trust proxy', 1)` enabled to ensure accurate IP identification behind Vercel/Nginx reverse proxies.
- **Jarvis AI Gateway (`/api/jarvis`)**:
  - Requires valid JWT authorization or restricted authenticated session.
  - Restricted CORS to trusted origins.
  - Clamped prompt lengths and output token limits to prevent quota exhaustion.

### 2.4 Input Validation & Sanitization
- **Avatars**: Avatar paths must be either recognized system assets (`/assets/...`), safe HTTPS links, or validated data URIs. Dangerous schemes (`javascript:`, `vbscript:`, `data:text/html`) are strictly blocked.
- **Chat Messages**: Message text capped at 5,000 characters; audio payloads capped at 250KB base64; file and sender names strictly clamped.
- **User Search**: SQL `LIKE` wildcard characters (`%`, `_`) sanitized and search query length capped.

## 3. Layer 3 Execution Scripts
- `execution/verify_security.js`: Automated regression test verifying auth barriers, secret protection, rate limit safety, and input sanitization.
