# SOP: Backend Server, Authentication & Asset Resilience

## 1. Goal
Ensure the backend Express server operates reliably as an independent process, user session state correctly toggles between Login and Logout without UI glitches, and all media/photos/drum-reels render gracefully with zero broken image artifacts.

## 2. Architecture & Components
- **Backend Service (`server/index.js`)**:
  - Standalone Express + SQLite (`sql.js`) server on port 3001.
  - JWT Bearer authentication.
  - Atomic persistence (`swag.db.tmp` -> `swag.db`).
  - Rate limiting, role restrictions, and input sanitation.
- **Frontend Client (`my-app/src/services/backendService.js`)**:
  - Proxied via Vite (`/api` -> `http://localhost:3001`).
  - Token caching in `localStorage`.
  - Non-crashing JSON/text response parser.
- **Header Auth State (`my-app/src/components/SiteHeader.jsx`)**:
  - Displays `ВХОД / РЕГИСТРАЦИЯ` when unauthenticated.
  - Displays `ВЫЙТИ` (styled as `.cyber-logout-btn`) when authenticated.
  - Profile dossier modal contains explicit `ВЫЙТИ` button.
- **Asset & Image Resilience (`my-app/src/utils/cyberImages.js`)**:
  - All public assets copied to `my-app/public/assets/`.
  - Vector SVG cyberpunk data URIs for all 9 edit reel covers and marketplace products.
  - Infallible `handleImageError` fallback handler preventing any image breakage.

## 3. Maintenance & Self-Annealing Instructions
- When adding new edits, ensure entries are added to `CYBER_EDIT_POSTERS` and `DEFAULT_EDITS`.
- Never use relative `/src/assets/` string literals in runtime state — use direct ES module imports or `/assets/...` public paths.
- Ensure the server process is gracefully terminated with `SIGINT`/`SIGTERM` to trigger atomic database sync.
