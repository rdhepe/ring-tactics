# Arena Forge

Turn-based wrestling tactics built with React, Vite, Express, Socket.IO, and PostgreSQL.

## Local Setup

Requirements:

- Node.js 22+
- PostgreSQL 15+

Create a database and restricted application user, then copy `.env.example` to `.env` and update `DATABASE_URL`.

```powershell
npm install
npm run dev:full
```

The API initializes its required tables and indexes idempotently during startup. It stops immediately if PostgreSQL is unavailable.

## Authentication

- Passwords are hashed with Argon2id using OWASP-aligned memory and iteration costs.
- Sessions use 256-bit opaque tokens. Only SHA-256 token hashes are stored in PostgreSQL.
- Browsers receive sessions through `HttpOnly`, `SameSite=Strict` cookies; production cookies also require HTTPS.
- Login and registration are rate-limited and return generic login failures.
- HTTP and Socket.IO use the same revocable, expiring database session.
- Account names are normalized and protected by a database uniqueness constraint.
- State-changing browser requests are restricted to configured origins.

## Production

Set these environment variables in the hosting platform:

- `NODE_ENV=production`
- `DATABASE_URL`: managed PostgreSQL connection string with TLS enabled
- `APP_ORIGIN`: exact public frontend origin, with no wildcard
- `VITE_API_URL`: public API origin used when building the frontend
- `PORT`: API listener port, if required by the platform
- `DATABASE_POOL_SIZE`: pool limit suitable for the database plan

Deploy the frontend and API under the same site (for example `game.example.com` and `api.example.com`) so strict cookies work predictably. Enable managed database backups, point-in-time recovery, TLS, monitoring, and credential rotation. Run at least two API instances behind a load balancer only after moving live room coordination from process memory to a shared service such as Redis.

Health check: `GET /health`

## Security Notes

The authentication layer is suitable as a secure application foundation, but a complete public identity product may also require email verification, password reset, MFA, abuse detection, audit events, privacy workflows, and terms appropriate to the launch region.# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
