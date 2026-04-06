# Vigil — Digital Estate Agent

> It acts when you stop checking in.

Vigil watches silently for your regular check-in (a "heartbeat"). If you go silent past a configured threshold, it wakes up, sends a push notification to your phone, and — if you don't respond — executes your pre-configured wishes on your behalf: farewell emails, file archives, repository transfers.

**The inversion that defines the product:** most agents act when instructed. Vigil acts when it stops hearing from you.

---

## How it works

```
ONBOARDING
  Sign in → connect Gmail / GitHub → chat with Vigil to describe your wishes
  → Vigil extracts intent, asks clarifying questions, confirms plan → saves to DB

NORMAL OPERATION
  Visit dashboard or click Check In → heartbeat recorded

SILENCE DETECTED  (cron, no LLM)
  Every hour: now − last_heartbeat > silence_threshold?
    No  → do nothing
    Yes → send Guardian push to phone via Auth0 CIBA

USER RESPONDS
  Approve → activation proceeds
  Cancel  → all actions marked cancelled, Vigil stands down
  No reply → after grace window → activation proceeds regardless

ACTIVATION  (LLM agent)
  Drafts personalized farewell messages using relationship context
  Executes Gmail, GitHub, Drive actions via Auth0 Token Vault
  Every event written to immutable audit log — no tokens ever logged
```

---

## Tech stack

| Layer         | Choice                                                             |
| ------------- | ------------------------------------------------------------------ |
| Framework     | Next.js 16 (App Router)                                            |
| Auth          | `@auth0/nextjs-auth0` v4 — OIDC, Token Vault, CIBA                 |
| Agent runtime | Vercel AI SDK v6 (`ai`, `@ai-sdk/react`)                           |
| Agent auth    | `@auth0/ai-vercel` v5 — `withTokenVault`, `withAsyncAuthorization` |
| LLM           | `moonshotai/kimi-k2-instruct` via Groq                             |
| LLM provider  | `@ai-sdk/groq`                                                     |
| Database      | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`)                     |
| Scheduler     | Cloudflare Cron Triggers (hourly)                                  |
| Styling       | Tailwind CSS v4                                                    |
| Deployment    | Cloudflare Workers (OpenNext)                                      |

---

## Security properties

- **Zero token-at-rest** — Vigil never stores OAuth credentials. Auth0 Token Vault holds them; the agent fetches short-lived tokens only at execution time.
- **Double-confirm design** — CIBA push gives you a final chance to cancel. The agent cannot fire unilaterally.
- **Minimal scopes** — each tool requests only what it needs (`gmail.send`, not `gmail.full`).
- **Immutable audit log** — every event written without token values. Fully inspectable.
- **Instantly revocable** — disconnecting an account revokes access immediately, even mid-execution.
- **Clean AI/cron separation** — the LLM touches nothing in silence detection. Cron is pure arithmetic.

---

## Project structure

```
vigil/
├── app/
│   ├── (auth)/login/page.tsx          # Landing / sign-in page
│   ├── dashboard/
│   │   ├── page.tsx                   # Status, heartbeat button, audit log
│   │   ├── setup/page.tsx             # Conversational onboarding chat
│   │   └── connect/page.tsx           # Connect Gmail / GitHub accounts
│   └── api/
│       ├── heartbeat/route.ts         # POST — user check-in
│       ├── chat/route.ts              # POST — setup chat (streaming)
│       ├── cron/check/route.ts        # GET  — hourly cron (pure time math)
│       ├── agent/execute/route.ts     # POST — trigger activation agent
│       └── audit/route.ts            # GET  — audit log for dashboard
├── lib/
│   ├── auth0.ts                       # Auth0Client singleton
│   ├── auth0-ai.ts                    # Token Vault + CIBA wrappers
│   ├── groq.ts                        # Groq client (kimi-k2-instruct)
│   ├── db/                            # Prisma helpers: heartbeats, actions, audit…
│   ├── agent/
│   │   ├── setup-chat.ts              # Phase 1: conversational config agent
│   │   └── executor.ts                # Phase 2: activation agent
│   └── scheduler/check-heartbeat.ts  # Pure time math, no LLM
├── components/
│   ├── HeartbeatButton.tsx
│   ├── SetupChat.tsx
│   ├── ConnectedAccounts.tsx
│   └── AuditLog.tsx
├── prisma/schema.prisma
├── prisma.config.ts                   # Prisma 7 datasource config
├── middleware.ts                      # Auth0 middleware
├── worker.ts                          # Custom worker with scheduled cron handler
├── wrangler.jsonc                     # Cloudflare worker + cron config
├── open-next.config.ts                # OpenNext Cloudflare config
└── .env.example
```

---

## Getting started

### 1. Clone and install

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
# Auth0 (v4 SDK — note variable names differ from v3)
AUTH0_SECRET=          # openssl rand -hex 32
APP_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=          # your-tenant.auth0.com (no https://)
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_AUDIENCE=https://vigil.api
GOOGLE_CONNECTION_NAME=google-oauth2
GITHUB_CONNECTION_NAME=github

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vigil

# LLM
GROQ_API_KEY=

# Cron auth
CRON_SECRET=           # any random string
```

### 3. Set up the database

```bash
# Run migrations (requires DATABASE_URL to be set)
npx prisma migrate dev --name init
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Auth0 setup checklist

- Create a **Regular Web Application** in your Auth0 dashboard
- Add `http://localhost:3000/auth/callback` to Allowed Callback URLs
- Add `http://localhost:3000` to Allowed Logout URLs
- Enable **Guardian MFA** (push notifications) for CIBA
- Set up **Social Connections**: Google OAuth2, GitHub
- Enable **Token Vault** for each connection with the required scopes:
  - Google: `gmail.send`, `drive.file`
  - GitHub: `repo`
- Create an **API** with audience `https://vigil.api`

---

## LLM model

Both phases use the same Groq client:

**Primary:** `moonshotai/kimi-k2-instruct` — built for multi-tool, multi-step agentic reasoning.

**Fallback:** `meta-llama/llama-4-scout-17b-16e-instruct` — swap in `lib/groq.ts` if needed.

---

## Deploy

```bash
pnpm build
pnpm preview
pnpm deploy
```

Set all environment variables in the Cloudflare Workers dashboard (or Wrangler secrets). The hourly cron runs via `wrangler.jsonc` trigger (`0 * * * *`) and executes through the custom `worker.ts` scheduled handler.
