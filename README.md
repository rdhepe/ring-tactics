# Ring Tactics

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
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`: from the Razorpay dashboard. Use `rzp_test_...` keys until payments are verified end-to-end, then switch to live keys. `RAZORPAY_KEY_SECRET` is read only on the server and must never be exposed to the frontend.
- `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME`: used to send account email-verification links via Brevo's transactional email API. `BREVO_SENDER_EMAIL` must be a sender address verified in your Brevo account (Senders & IP → Senders). If unset, registration still works but verification emails are skipped (logged as a warning) — fine for local dev, required in production.

Deploy the frontend and API under the same site (for example `game.example.com` and `api.example.com`) so strict cookies work predictably. Enable managed database backups, point-in-time recovery, TLS, monitoring, and credential rotation. Run at least two API instances behind a load balancer only after moving live room coordination from process memory to a shared service such as Redis.

Health check: `GET /health`

## Economy & Anti-Cheat

Coins, diamonds, and wrestler unlocks are stored server-side in the `wallets` and `unlocked_characters` tables and are never trusted from the client:

- Diamonds are only credited after a Razorpay payment signature is verified server-side (`/payments/verify`), and each order can be credited at most once.
- Coins are only credited server-side when a ranked ladder match concludes (`isLadder` rooms), using the authoritative battle outcome computed by the server, not client-reported results.
- Unlocking a wrestler (`/economy/unlock`) always re-derives the rarity and cost from the server-side catalog and atomically checks/deducts the balance in a transaction — a tampered client request can't unlock a wrestler for free or for less than its real cost.
- The client's local currency display is a cache refreshed from `GET /economy`; editing browser storage does not grant currency or unlocks.

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
