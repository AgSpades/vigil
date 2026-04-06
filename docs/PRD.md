# Vigil — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Author:** Vigil Team  
**Last updated:** April 2026  
**Hackathon:** Authorized to Act — Auth0 for AI Agents (Devpost)

---

## 1. Overview

### 1.1 Product summary

Vigil is a digital estate agent. Users configure what happens to their digital
life — emails, files, repositories — when they go silent. Vigil watches for a
regular check-in from the user. If silence exceeds a configured threshold, it
sends a push confirmation via Auth0 CIBA. If there is no response within a
grace window, an AI agent executes the user's pre-written instructions on their
behalf — drafting personalized messages, archiving files, and transferring
repositories.

### 1.2 The core inversion

Most AI agents act when instructed. Vigil acts when it stops hearing from you.

### 1.3 Problem statement

People accumulate meaningful digital assets — repositories, documents, ongoing
email threads, accounts — with no plan for what happens to them if they become
incapacitated or die. Existing solutions (legal wills, password managers handed
to family) are manual, static, and require the heir to know what to do. There
is no system that can act intelligently and automatically on a person's behalf,
using their own words, at the right moment, without requiring constant
maintenance.

### 1.4 Solution

A dormant AI agent that holds delegated access to a user's connected accounts
via Auth0 Token Vault. The agent is configured once through a conversational
interface, then goes silent. It wakes up only when the user stops checking in
— and even then, asks one final time before acting.

### 1.5 Hackathon constraint

Auth0 Token Vault is the non-negotiable core of the security model. Vigil
never stores OAuth tokens locally. Every tool execution fetches a short-lived
token from Token Vault at runtime via secure token exchange.

---

## 2. Goals and non-goals

### 2.1 Goals

- Allow users to configure post-silence instructions entirely through natural
  language conversation with an AI agent.
- Detect user silence using a simple timestamp comparison, not AI.
- Require explicit user confirmation (Auth0 CIBA push) before any action fires.
- Execute actions using tokens fetched from Auth0 Token Vault at runtime only.
- Draft personalized farewell messages using an LLM, not templates.
- Log every event — check-ins, CIBA events, action executions — to an
  immutable audit trail.
- Allow users to revoke access to any connected service at any time.

### 2.2 Non-goals (v1)

- Mobile native application. Web only.
- Support for services beyond Gmail, Google Drive, and GitHub.
- Recurring or scheduled actions (birthday emails, annual messages).
- Multi-user accounts or shared estates.
- Legal validity of instructions (Vigil is not a legal instrument).
- Offline or self-hosted deployment.

---

## 3. Users

### 3.1 Primary user

A technically literate individual who maintains meaningful digital assets —
active GitHub repositories, important documents in Google Drive, ongoing
professional or personal email threads — and wants a plan for what happens
to them in the event of incapacitation or death.

**Characteristics:**

- Comfortable with OAuth consent flows
- Has a smartphone capable of receiving Auth0 Guardian push notifications
- Has at least one Google account and one GitHub account
- Is willing to spend 10–15 minutes in a setup conversation once

### 3.2 Secondary user (beneficiary)

The person(s) designated by the primary user to receive emails, file access,
or repository ownership. The beneficiary has no Vigil account and takes no
action on the platform. They receive only what Vigil sends them.

---

## 4. User stories

### Setup

- As a user, I want to log in with my existing Google or GitHub account so
  that I don't need to create new credentials.
- As a user, I want to connect my Gmail, Google Drive, and GitHub accounts
  to Vigil so that it can act on my behalf.
- As a user, I want to describe my wishes in plain language so that I don't
  have to fill out forms or learn a configuration syntax.
- As a user, I want Vigil to ask me clarifying questions during setup so that
  my instructions are complete and unambiguous.
- As a user, I want to see a plain-English summary of my configured plan
  before it is saved so that I can verify it is correct.
- As a user, I want to be able to revise my instructions at any time so that
  my plan stays current.

### Normal operation

- As a user, I want to check in with a single button click so that Vigil
  knows I am still here.
- As a user, I want to see when I last checked in and how much time remains
  before Vigil alerts me so that I can stay in control.
- As a user, I want to revoke a connected account at any time so that Vigil
  immediately loses access to that service.

### Activation

- As a user, I want to receive a push notification before Vigil acts so that
  I have a final chance to cancel if I am still alive.
- As a user, I want Vigil to stand down immediately if I cancel the push
  notification so that no action fires without my implicit consent.
- As a user, I want my farewell messages to sound like me — using the
  relationship context I provided — not like a template.
- As a user, I want to see a full audit log of everything Vigil did so that
  my beneficiaries (or I, if I survive) can understand exactly what happened.

---

## 5. Functional requirements

### 5.1 Authentication

| ID      | Requirement                                                                                 | Priority |
| ------- | ------------------------------------------------------------------------------------------- | -------- |
| AUTH-01 | Users must authenticate via Auth0 OIDC before accessing any feature.                        | P0       |
| AUTH-02 | Session must persist across browser refreshes using Auth0 session cookies.                  | P0       |
| AUTH-03 | Unauthenticated requests to any `/dashboard` or `/onboarding` route must redirect to login. | P0       |

### 5.2 Account connection (Token Vault)

| ID      | Requirement                                                                                                                                                       | Priority |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| CONN-01 | Users must be able to connect a Gmail account via Auth0 Connected Accounts flow.                                                                                  | P0       |
| CONN-02 | Users must be able to connect a GitHub account via Auth0 Connected Accounts flow.                                                                                 | P0       |
| CONN-03 | Users must be able to connect a Google Drive account via Auth0 Connected Accounts flow.                                                                           | P1       |
| CONN-04 | Connected account tokens must be stored exclusively in Auth0 Token Vault. Vigil's database must never contain OAuth access tokens or refresh tokens.              | P0       |
| CONN-05 | Users must be able to disconnect any connected account at any time from the dashboard. Disconnection must immediately revoke Vigil's ability to use that service. | P0       |
| CONN-06 | The dashboard must display the connection status and granted scopes for each service.                                                                             | P1       |

### 5.3 Conversational setup (Phase 1 AI)

| ID       | Requirement                                                                                                                     | Priority |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| SETUP-01 | The setup interface must be a streaming chat UI, not a form.                                                                    | P0       |
| SETUP-02 | The AI agent must extract structured intent (contact, service, trigger days, relationship context) from natural language input. | P0       |
| SETUP-03 | The AI agent must ask clarifying questions when the user's intent is ambiguous or incomplete.                                   | P0       |
| SETUP-04 | The AI agent must confirm the full parsed plan back to the user in plain English before saving anything.                        | P0       |
| SETUP-05 | The AI agent must only call database-writing tools after the user explicitly confirms the plan.                                 | P0       |
| SETUP-06 | The AI agent must only suggest actions for services the user has already connected.                                             | P0       |
| SETUP-07 | Each staged action must be stored with: trigger days, action type, structured config, and contact relationship context.         | P0       |
| SETUP-08 | Users must be able to return to the setup chat at any time to revise or add instructions.                                       | P1       |

### 5.4 Silence detection (cron — no AI)

| ID      | Requirement                                                                                                                                         | Priority |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| CRON-01 | A Vercel Cron Job must run every hour and check every active user's `last_seen_at` timestamp.                                                       | P0       |
| CRON-02 | The cron job must contain no LLM calls. It performs time arithmetic only.                                                                           | P0       |
| CRON-03 | If `NOW() - last_seen_at > silence_days` and no CIBA push has been sent, the cron job must send a CIBA push notification and record `ciba_sent_at`. | P0       |
| CRON-04 | If `NOW() - ciba_sent_at > grace_hours` and `cancelled_at` is null, the cron job must call `triggerActivation()`.                                   | P0       |
| CRON-05 | The cron endpoint must require a `x-cron-secret` header matching `process.env.CRON_SECRET`. Unauthenticated calls must return 403.                  | P0       |
| CRON-06 | Users must be able to configure `silence_days` (default: 7) and `grace_hours` (default: 24) from the dashboard settings.                            | P1       |

### 5.5 Check-in

| ID         | Requirement                                                                                    | Priority |
| ---------- | ---------------------------------------------------------------------------------------------- | -------- |
| CHECKIN-01 | A `POST /api/checkin` endpoint must update the authenticated user's `last_seen_at` to `NOW()`. | P0       |
| CHECKIN-02 | The dashboard must display a prominent "I'm here" button that calls this endpoint.             | P0       |
| CHECKIN-03 | On successful check-in, the button must briefly show "✓ Checked in" for 3 seconds then revert. | P1       |
| CHECKIN-04 | Every check-in must be recorded in the audit log.                                              | P0       |

### 5.6 CIBA confirmation gate

| ID      | Requirement                                                                                                                                | Priority |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| CIBA-01 | When silence threshold is crossed, Auth0 Guardian must send a push notification to the user's enrolled device.                             | P0       |
| CIBA-02 | The push notification binding message must include the number of days of silence and a clear approve/cancel choice.                        | P0       |
| CIBA-03 | If the user cancels the push, `cancelled_at` must be set and all pending staged actions must be marked cancelled. The agent must not fire. | P0       |
| CIBA-04 | If the push expires unanswered after `grace_hours`, the agent must proceed to activation.                                                  | P0       |
| CIBA-05 | CIBA push and grace window logic must span two separate cron runs, not a single blocking HTTP call.                                        | P0       |

### 5.7 Activation agent (Phase 2 AI)

| ID      | Requirement                                                                                                                                                                  | Priority |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| EXEC-01 | The activation agent must receive all pending staged actions and all stored contact context for the user.                                                                    | P0       |
| EXEC-02 | The LLM must reason over execution order, prioritizing actions with lower `trigger_days` first.                                                                              | P0       |
| EXEC-03 | For Gmail actions, the LLM must draft a personalized message using the contact's stored relationship context. It must not use generic templates.                             | P0       |
| EXEC-04 | Each tool call must fetch its OAuth token from Auth0 Token Vault at runtime. Tokens must not be passed between tool calls or stored in memory beyond the immediate API call. | P0       |
| EXEC-05 | If one action fails, the agent must log the failure and continue executing remaining actions. It must not abort the sequence.                                                | P0       |
| EXEC-06 | Every action execution — success or failure — must be written to the audit log with action ID, type, and timestamp. Token values must never appear in the log.               | P0       |
| EXEC-07 | The activation agent must use `moonshotai/kimi-k2-instruct` via Groq as the LLM.                                                                                             | P0       |

### 5.8 Supported action types

| Action type       | Service      | Scope required | Description                                                    |
| ----------------- | ------------ | -------------- | -------------------------------------------------------------- |
| `gmail_send`      | Gmail        | `gmail.send`   | Draft and send a personalized email to a contact               |
| `drive_archive`   | Google Drive | `drive.file`   | Create a shared folder and grant read access to a target email |
| `github_transfer` | GitHub       | `repo`         | Transfer repository ownership to a designated GitHub username  |
| `webhook`         | Custom       | None           | POST a JSON payload to a user-specified URL                    |

### 5.9 Audit log

| ID       | Requirement                                                                                                                                                                                        | Priority |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AUDIT-01 | Every system event must be written to an immutable `audit_log` table.                                                                                                                              | P0       |
| AUDIT-02 | Audit events must include: `user_id`, `event_type`, `detail` (JSON), `occurred_at`.                                                                                                                | P0       |
| AUDIT-03 | Token values must never appear in any audit log entry or application log.                                                                                                                          | P0       |
| AUDIT-04 | The dashboard must display the audit log in reverse chronological order with event type color coding.                                                                                              | P1       |
| AUDIT-05 | Event types to log: `checkin`, `ciba_sent`, `ciba_approved`, `ciba_denied`, `action_executed`, `action_failed`, `agent_cancelled`, `setup_confirmed`, `account_connected`, `account_disconnected`. | P0       |

---

## 6. Non-functional requirements

### 6.1 Security

- OAuth tokens must never be stored in Vigil's database, application memory
  beyond immediate use, or application logs.
- All API routes must validate the Auth0 session before processing.
- The cron endpoint must validate `x-cron-secret` before processing.
- Each tool must request the minimum OAuth scope needed for its operation.
- Token Vault revocation must take effect immediately — a revoked connection
  must cause the next token fetch to fail, not return a cached token.

### 6.2 Reliability

- The CIBA send and grace window check must be idempotent — running the cron
  job twice for the same user in the same hour must not send two pushes.
- Action execution must be fault-tolerant — a failed action must not block
  subsequent actions.
- The `last_seen_at` update must be atomic — concurrent requests must not
  create race conditions.

### 6.3 Performance

- The setup chat must stream responses — the first token must appear within
  1 second of the user sending a message.
- The dashboard must load within 2 seconds on a standard connection.
- The cron job must complete processing all active users within 55 seconds
  (Vercel's cron timeout is 60 seconds).

### 6.4 Privacy

- Vigil stores only what is necessary: user ID, `last_seen_at`, config,
  staged actions, contact context, and audit log.
- Contact relationship context is stored as plain text and is visible only
  to the authenticated user.
- No analytics, tracking pixels, or third-party data sharing.

---

## 7. Data model

### 7.1 Tables

```
User
  id            TEXT PK          -- Auth0 sub
  email         TEXT
  created_at    TIMESTAMPTZ

VigilConfig
  user_id       TEXT PK FK
  silence_days  INT DEFAULT 7
  grace_hours   INT DEFAULT 24
  last_seen_at  TIMESTAMPTZ      -- updated on every check-in
  ciba_sent_at  TIMESTAMPTZ?
  activated_at  TIMESTAMPTZ?
  cancelled_at  TIMESTAMPTZ?

StagedAction
  id            SERIAL PK
  user_id       TEXT FK
  trigger_days  INT              -- silence duration that triggers this action
  action_type   TEXT             -- gmail_send | drive_archive | github_transfer | webhook
  action_config JSONB            -- structured config extracted by LLM
  executed_at   TIMESTAMPTZ?
  status        TEXT DEFAULT 'pending'  -- pending | executed | failed | cancelled

ContactContext
  id            SERIAL PK
  user_id       TEXT FK
  contact_name  TEXT
  contact_email TEXT?
  relationship  TEXT             -- "sister", "mentor", "colleague"
  context       TEXT             -- user's own words, used by LLM to draft messages

AuditLog
  id            SERIAL PK
  user_id       TEXT FK
  event_type    TEXT
  detail        JSONB?
  occurred_at   TIMESTAMPTZ DEFAULT NOW()
```

### 7.2 Key design decisions

- No separate heartbeat history table. `last_seen_at` is a single column on
  `VigilConfig`. Vigil only ever asks "when was the user last seen?" — not
  "show me all their check-ins." The audit log captures check-in history for
  display purposes.
- No pgvector. Vigil's data is entirely relational and time-based. No
  embeddings, no semantic search, no similarity queries.
- `ContactContext.context` is free text. The LLM receives it at activation
  time and uses it to draft messages. It is never parsed or structured
  further by the application.

---

## 8. System architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User (browser)                       │
└───────────┬─────────────────────────────────────────────────┘
            │ HTTPS
┌───────────▼─────────────────────────────────────────────────┐
│                    Next.js 16 (Vercel)                      │
│                                                             │
│  /dashboard          → Dashboard UI                         │
│  /onboarding/connect → Account connection UI                │
│  /onboarding/setup   → Setup chat UI                        │
│                                                             │
│  POST /api/checkin          → updates last_seen_at          │
│  POST /api/chat             → streams setup agent response  │
│  GET  /api/cron/check       → hourly silence detection      │
│  POST /api/agent/execute    → triggers activation agent     │
│  GET  /api/audit            → returns audit log             │
└──────┬──────────────────┬──────────────────┬────────────────┘
       │                  │                  │
┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼──────────────┐
│   Auth0      │  │    Postgres     │  │   Groq API          │
│              │  │    (Prisma)     │  │                     │
│  OIDC login  │  │                 │  │  kimi-k2-instruct   │
│  Token Vault │  │  VigilConfig    │  │                     │
│  CIBA push   │  │  StagedAction   │  │  Setup chat agent   │
│              │  │  ContactContext │  │  Activation agent   │
│  Gmail token │  │  AuditLog       │  │                     │
│  Drive token │  │                 │  └────────────────────┘
│  GitHub token│  └─────────────────┘
└──────┬───────┘
       │ Token exchange (at execution time only)
┌──────▼──────────────────────────────────────────────────────┐
│              External APIs (called by activation agent)      │
│                                                              │
│   Gmail API   ·   Google Drive API   ·   GitHub API         │
└─────────────────────────────────────────────────────────────┘
```

### 8.1 AI layer separation

```
CRON JOB     → time math only. no LLM. detects silence. sends CIBA.
SETUP AGENT  → kimi-k2-instruct. extracts intent. asks questions. saves config.
EXEC AGENT   → kimi-k2-instruct. drafts messages. plans execution. calls tools.
TOKEN VAULT  → holds all OAuth credentials. never touched directly by any agent.
```

---

## 9. API specification

### `POST /api/checkin`

Updates `last_seen_at` for the authenticated user.

**Auth:** Auth0 session required.  
**Request body:** None.  
**Response:**

```json
{ "ok": true, "last_seen_at": "2026-04-06T14:32:00Z" }
```

**Side effects:** Writes `checkin` event to audit log.

---

### `POST /api/chat`

Streams a response from the setup agent.

**Auth:** Auth0 session required.  
**Request body:**

```json
{ "messages": [{ "role": "user", "content": "..." }] }
```

**Response:** Server-sent event stream (Vercel AI SDK format).  
**Side effects:** On `confirmSetup` tool call, writes staged actions and
contact context to database. Writes `setup_confirmed` to audit log.

---

### `GET /api/cron/check`

Hourly silence detection. Called by Vercel Cron.

**Auth:** `x-cron-secret` header required.  
**Response:**

```json
{ "checked": 42 }
```

**Side effects:** May send CIBA push. May call `triggerActivation()`.
Writes events to audit log.

---

### `GET /api/audit`

Returns the audit log for the authenticated user.

**Auth:** Auth0 session required.  
**Query params:** `limit` (default 20), `offset` (default 0).  
**Response:**

```json
{
  "events": [
    {
      "id": 1,
      "event_type": "action_executed",
      "detail": { "actionId": 3, "to": "priya@gmail.com" },
      "occurred_at": "2026-04-06T14:32:00Z"
    }
  ],
  "total": 84
}
```

---

## 10. User flows

### 10.1 First-time setup

```
1. User visits vigil.app → sees landing page
2. Clicks "Begin your vigil" → redirected to Auth0 login
3. Logs in → redirected to /onboarding/connect
4. Connects Gmail (required) + optionally GitHub, Drive via Token Vault
5. Clicks "Continue to setup" → /onboarding/setup
6. Chats with Vigil setup agent:
   a. Describes wishes in natural language
   b. Agent asks clarifying questions
   c. Agent confirms parsed plan
   d. User confirms → actions saved, last_seen_at set to NOW()
7. Redirected to /dashboard → status: WATCHING
```

### 10.2 Normal check-in

```
1. User visits /dashboard
2. Sees last_seen_at + days remaining before alert
3. Clicks "I'm here" → POST /api/checkin → last_seen_at = NOW()
4. Button briefly shows "✓ Checked in"
5. Audit log records checkin event
```

### 10.3 Activation (user does not respond)

```
1. Cron runs: NOW() - last_seen_at > silence_days
2. CIBA push sent to user's phone:
   "Vigil: no check-in for 7 days. Approve to execute your
    instructions, or cancel to stand down."
3. ciba_sent_at recorded. Cron exits.
4. Cron runs again (next hour): grace_hours elapsed, cancelled_at is null
5. triggerActivation(userId) called
6. Activation agent receives staged_actions + contact_context
7. Agent drafts personalized email to Priya using relationship context
8. Agent calls sendGmail tool → Token Vault issues short-lived Gmail token
9. Gmail API call executes → email delivered
10. Action marked executed → audit log written
11. Agent calls transferGithubRepo tool → Token Vault issues GitHub token
12. GitHub API call executes → repo transferred
13. Action marked executed → audit log written
```

### 10.4 Activation cancelled by user

```
1. CIBA push sent (same as above, step 2)
2. User taps "Cancel" on Guardian push
3. cancelled_at set on VigilConfig
4. All pending staged_actions marked cancelled
5. Audit log records agent_cancelled
6. Dashboard status: STANDING DOWN
7. User can re-activate by checking in (resetting last_seen_at)
   and manually clearing cancelled_at from settings
```

---

## 11. Tech stack

| Layer         | Choice                                 |
| ------------- | -------------------------------------- |
| Framework     | Next.js 16 (App Router)                |
| Auth          | Auth0 via `@auth0/nextjs-auth0`        |
| Agent runtime | Vercel AI SDK (`ai`)                   |
| Agent auth    | `@auth0/ai-vercel`                     |
| LLM           | `moonshotai/kimi-k2-instruct` via Groq |
| LLM SDK       | `@ai-sdk/groq`                         |
| Database      | Postgres via Prisma                    |
| Scheduler     | Vercel Cron Jobs                       |
| Styling       | Tailwind CSS                           |
| Deployment    | Vercel                                 |

---

## 12. Out of scope (future)

- **Recurring messages** — annual check-ins, birthday emails
- **Multiple beneficiary tiers** — different people getting different levels
  of access at different thresholds
- **Legal document generation** — auto-drafted wills or letters of wishes
- **Crypto wallet transfer** — private key delegation
- **Mobile app** — native iOS/Android with biometric check-in
- **Slack / Notion / Linear integrations** — beyond Gmail, Drive, GitHub
- **Multi-language message drafting** — LLM drafts in the contact's language
- **Proof of life verification** — biometric or third-party confirmation
  before activation

---

## 13. Risks

| Risk                                                              | Likelihood | Impact | Mitigation                                                                                                                                                                    |
| ----------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth0 CIBA push not delivered (user not enrolled in Guardian MFA) | Medium     | High   | Require Guardian MFA enrollment as part of onboarding. Block setup completion without it.                                                                                     |
| Groq API rate limit hit during activation                         | Low        | High   | Activation is rare and per-user. 60 req/min on Kimi K2 is more than sufficient. Log and retry once on 429.                                                                    |
| Token Vault token expired at execution time                       | Low        | Medium | Auth0 handles refresh automatically. Catch 401s from APIs and re-fetch token before retrying once.                                                                            |
| LLM drafts a message the user would not have approved             | Medium     | High   | Store relationship context verbatim in the user's own words. System prompt instructs the model to stay within what the user described. Audit log shows exactly what was sent. |
| Cron job processes same user twice in one window                  | Low        | Medium | Check `ciba_sent_at` before sending push. Idempotent by design.                                                                                                               |
| User dies before completing setup                                 | Medium     | Low    | Partial setup is a known edge case. Vigil takes no action if no staged actions are configured.                                                                                |

---

## 14. Success metrics

- Auth0 Token Vault used for all OAuth credential storage — zero tokens in
  Vigil's database.
- CIBA flow demonstrated end-to-end — push notification visible in demo,
  both approve and cancel paths shown.
- LLM-drafted message demonstrably personalized — uses relationship context
  provided during setup, not a generic template.
- Audit log verifiably clean — no token values in any log entry.
- Setup chat demonstrably extracts structured intent from unstructured
  natural language in under 3 conversation turns.

---

## 15. Implementation Status Snapshot (Codebase)

Checked on: 2026-04-06

Legend:

- `[x]` implemented in current codebase
- `[ ]` not implemented or only partially implemented

### 5.1 Authentication

- [x] AUTH-01 — Auth0 OIDC required before protected features
- [x] AUTH-02 — Session persists via Auth0 session cookies
- [x] AUTH-03 — Unauthenticated `/dashboard` and `/onboarding` access redirects to login

### 5.2 Account connection (Token Vault)

- [x] CONN-01 — Gmail connection flow exists
- [x] CONN-02 — GitHub connection flow exists
- [x] CONN-03 — Google Drive connection flow exists
- [x] CONN-04 — Token Vault-based connection model in use (no token storage in app DB code)
- [ ] CONN-05 — Disconnect any connected account at any time (session-backed accounts are currently non-disconnectable in this tenant setup)
- [x] CONN-06 — Dashboard shows connection status and granted scopes

### 5.3 Conversational setup (Phase 1 AI)

- [x] SETUP-01 — Streaming chat UI exists
- [x] SETUP-02 — Structured intent extraction path exists via tools
- [x] SETUP-03 — Clarifying-question behavior is prompted
- [x] SETUP-04 — Plan confirmation behavior is prompted
- [ ] SETUP-05 — Strict enforcement that writes only occur after explicit confirmation
- [ ] SETUP-06 — Strict enforcement that actions are only suggested for connected services
- [x] SETUP-07 — Staged actions + contact context persisted
- [x] SETUP-08 — Setup can be revisited from dashboard

### 5.4 Silence detection (cron — no AI)

- [x] CRON-01 — Cron check endpoint and active-user iteration exist
- [x] CRON-02 — Cron path uses time arithmetic (no LLM calls)
- [x] CRON-03 — CIBA send path + `ciba_sent` audit logging exists
- [x] CRON-04 — Grace window triggers activation path
- [x] CRON-05 — `x-cron-secret` check exists
- [ ] CRON-06 — User-facing settings UI for `silence_days` and `grace_hours`

### 5.5 Check-in

- [ ] CHECKIN-01 — Exact `/api/checkin` contract updating `last_seen_at` (current implementation uses `/api/heartbeat` and heartbeat records)
- [x] CHECKIN-02 — Dashboard check-in button exists
- [x] CHECKIN-03 — Checked-in UX state exists in the heartbeat button flow
- [x] CHECKIN-04 — Check-in event is logged to audit

### 5.6 CIBA confirmation gate

- [x] CIBA-01 — CIBA push trigger flow exists
- [x] CIBA-02 — Binding message includes silence days + approve/cancel intent
- [ ] CIBA-03 — Explicit cancel callback handling that sets `cancelled_at` and cancels pending actions
- [x] CIBA-04 — Grace expiry proceeds to activation
- [x] CIBA-05 — Send and grace logic run across separate cron executions

### 5.7 Activation agent (Phase 2 AI)

- [x] EXEC-01 — Pending actions + contact context loaded into activation
- [x] EXEC-02 — Execution order prioritizes lower `trigger_days`
- [x] EXEC-03 — Gmail drafting is personalized using relationship context
- [x] EXEC-04 — Tool execution obtains tokens via Token Vault pattern
- [x] EXEC-05 — Per-action failure is logged and sequence continues
- [x] EXEC-06 — Success/failure events are written to audit log
- [x] EXEC-07 — Groq model set to `moonshotai/kimi-k2-instruct`

### 5.8 Supported action types

- [x] `gmail_send`
- [x] `drive_archive`
- [x] `github_transfer`
- [x] `webhook`

### 5.9 Audit log

- [x] AUDIT-01 — Audit table/write path exists and is actively used
- [x] AUDIT-02 — `user_id`, `event_type`, `detail`, `occurred_at` captured
- [x] AUDIT-03 — No token values intentionally logged in current logging paths
- [ ] AUDIT-04 — Event type color coding in dashboard audit UI
- [ ] AUDIT-05 — Event naming currently differs from PRD canonical list in some places (for example `heartbeat` vs `checkin`, `connection_removed`, `tasks_cancelled`, `task_cancelled`)

---

_"Vigil never holds your credentials. The LLM writes what you meant to say.
Auth0 Token Vault holds what it needs to send it. And it only acts when
you're no longer there to stop it."_
