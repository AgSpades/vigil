# Vigil — Master Build Prompt (v3)

## What you are building

**Vigil** is a digital estate agent. It watches silently for a user's regular
check-in (a "heartbeat"). If the heartbeat stops for longer than a
user-configured threshold, Vigil wakes up, sends a CIBA push notification to
the user's phone, and if there is no response within a grace window, executes
a staged set of pre-configured actions on the user's behalf.

**The inversion that defines the product:** most agents act when instructed.
Vigil acts when it stops hearing from you.

---

## Where AI earns its place (be honest about this)

There are exactly two phases where an LLM does real, non-replaceable work:

### Phase 1 — Conversational setup (onboarding chat)

Instead of a form-based timeline builder, the user talks to Vigil in a chat
interface. They describe their wishes in natural language:

> "Email my sister Priya at priya@gmail.com after a week. We grew up together
> in Chennai — tell her I was happy. After a month, transfer my GitHub repos
> to my friend Arjun, username arjun-dev. Archive my Drive too."

The LLM agent:

- Extracts structured intent from the message
- Identifies gaps and asks clarifying questions ("All repos, or specific ones?")
- Confirms the parsed plan back to the user in plain English
- On confirmation, writes the structured config to the database

This replaces dropdowns, drag-and-drop builders, and form fields entirely.
The conversation IS the configuration UI.

### Phase 2 — Activation (message drafting + execution planning)

When Vigil activates, the agent:

- Receives the user's stored wishes + per-contact relationship context
- Uses an LLM to draft a personalized farewell message for each contact
- Reasons over execution order (e.g. email family before colleagues)
- Handles failures gracefully (if GitHub transfer fails, log and continue)
- Calls tools backed by Token Vault to execute each action

The AI is the _author and executor_ of the final actions, not a wrapper
around a switch statement.

### What the cron job does (no AI)

The cron job does exactly one thing: time arithmetic. It checks whether
`NOW() - last_heartbeat > silence_days`. If yes, it sends the CIBA push and
hands off to the agent. There is no LLM in the cron job. The separation is
clean and defensible.

```
CRON JOB          → time math only. detects silence. sends CIBA.
LLM AGENT         → setup conversation. message drafting. execution planning.
AUTH0 TOKEN VAULT → holds all OAuth credentials. never touched by cron or LLM directly.
```

---

## Tech stack

| Layer            | Choice                                 | Reason                                                             |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------ |
| Framework        | Next.js 14 (App Router)                | API routes + frontend in one repo                                  |
| Auth             | Auth0 (`@auth0/nextjs-auth0`)          | OIDC login, Token Vault, CIBA                                      |
| Agent runtime    | Vercel AI SDK (`ai`)                   | Tool calling, streaming chat, structured output                    |
| Agent auth       | `@auth0/ai-vercel`                     | Token Vault + async authorization wrappers                         |
| LLM              | `moonshotai/kimi-k2-instruct` via Groq | Strong tool calling, agentic reasoning, free tier viable           |
| LLM provider SDK | `@ai-sdk/groq`                         | Vercel AI SDK Groq adapter — one-line swap from any other provider |
| Database         | Postgres via Prisma                    | Relational time-based data only. No pgvector needed.               |
| Scheduler        | Vercel Cron Jobs                       | Hourly heartbeat check, no extra infra                             |
| Styling          | Tailwind CSS                           | Speed                                                              |
| Deployment       | Vercel                                 | Zero config, native cron support                                   |

---

## LLM model selection (Groq)

Both phases use the same model and the same Groq client instance.

**Primary: `moonshotai/kimi-k2-instruct`**

- 60 req/min, 1K req/day, 10K TPM, 300K TPD
- Best choice for agentic tool calling — built specifically for multi-tool,
  multi-step reasoning. Handles the setup chat's `saveAction` / `saveContact`
  / `confirmSetup` tool sequence reliably.
- Higher request rate (60 vs 30) is useful for streaming chat turns.

**Fallback: `meta-llama/llama-4-scout-17b-16e-instruct`**

- 30 req/min, 1K req/day, 30K TPM, 500K TPD
- Use this if Kimi K2 underperforms on tool calling in testing.
- More generous token-per-day limit — useful if activation messages are long.

**Do not use:**

- `llama-3.1-8b-instant` — too small for reliable multi-tool calling
- `llama-3.3-70b-versatile` — 100K TPD is dangerously tight for a demo day
- `groq/compound` / `groq/compound-mini` — unpredictable tool use behavior

**Shared client pattern — define once, import everywhere:**

```typescript
// lib/groq.ts
import { createGroq } from "@ai-sdk/groq";

export const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
export const model = groq("moonshotai/kimi-k2-instruct");

// To swap models during testing, change only this file.
// Fallback: groq('meta-llama/llama-4-scout-17b-16e-instruct')
```

Import `model` from `@/lib/groq` in both `setup-chat.ts` and `executor.ts`.
The Vercel AI SDK abstracts the provider entirely — `streamText`, `generateText`,
`tool()`, and `z.object()` schemas are identical regardless of which provider
sits underneath.

---

**No pgvector.** Vigil's data is entirely relational and time-based.
The only query that matters is "when was the last heartbeat?" —
plain Postgres with an indexed timestamp column is exactly right.

---

## Repository structure

```
vigil/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── dashboard/
│   │   ├── page.tsx               # Home: heartbeat status + audit log
│   │   ├── setup/page.tsx         # Conversational onboarding chat
│   │   └── connect/page.tsx       # Connect accounts (Token Vault)
│   └── api/
│       ├── heartbeat/route.ts     # POST — user check-in
│       ├── chat/route.ts          # POST — setup conversation (streaming)
│       ├── cron/check/route.ts    # GET — hourly cron, pure time math
│       ├── agent/execute/route.ts # POST — LLM agent fires on activation
│       └── audit/route.ts         # GET — audit log for dashboard
├── lib/
│   ├── auth0.ts                   # Auth0Client singleton
│   ├── auth0-ai.ts                # Token Vault + CIBA wrappers
│   ├── db/
│   │   ├── schema.prisma
│   │   ├── heartbeats.ts
│   │   ├── staged-actions.ts
│   │   ├── contact-context.ts
│   │   └── audit.ts
│   ├── agent/
│   │   ├── setup-chat.ts          # Phase 1: conversational config agent
│   │   ├── executor.ts            # Phase 2: activation agent
│   │   └── tools/
│   │       ├── save-action.ts     # Tool: persist a parsed staged action
│   │       ├── ask-clarification.ts # Tool: request more info from user
│   │       ├── gmail.ts           # Tool: send email via Gmail API
│   │       ├── drive.ts           # Tool: archive Drive files
│   │       ├── github.ts          # Tool: transfer repo ownership
│   │       └── webhook.ts         # Tool: POST to arbitrary URL
│   └── scheduler/
│       └── check-heartbeat.ts     # Pure time math, no LLM
├── components/
│   ├── HeartbeatButton.tsx
│   ├── SetupChat.tsx              # Chat UI for onboarding
│   ├── ConnectedAccounts.tsx
│   └── AuditLog.tsx
├── vercel.json
└── .env.local
```

---

## Database schema (Prisma)

```prisma
// schema.prisma

model User {
  id           String         @id           // Auth0 sub
  email        String
  createdAt    DateTime       @default(now())
  config       VigilConfig?
  heartbeats   Heartbeat[]
  stagedActions StagedAction[]
  contacts     ContactContext[]
  auditLogs    AuditLog[]
}

model Heartbeat {
  id          Int      @id @default(autoincrement())
  userId      String
  checkedInAt DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])

  @@index([userId, checkedInAt(sort: Desc)])
}

model VigilConfig {
  userId       String    @id
  silenceDays  Int       @default(7)
  graceHours   Int       @default(24)
  cibaSentAt   DateTime?
  activatedAt  DateTime?
  cancelledAt  DateTime?
  user         User      @relation(fields: [userId], references: [id])
}

// One row per staged action, written by the setup chat agent
model StagedAction {
  id           Int       @id @default(autoincrement())
  userId       String
  triggerDays  Int                          // silence duration that triggers this
  actionType   String                       // 'gmail_send' | 'drive_archive' | 'github_transfer' | 'webhook'
  actionConfig Json                         // structured config extracted by LLM
  executedAt   DateTime?
  status       String    @default("pending") // 'pending' | 'executed' | 'failed' | 'cancelled'
  user         User      @relation(fields: [userId], references: [id])
}

// Per-contact relationship context — used by LLM to draft messages
model ContactContext {
  id          Int    @id @default(autoincrement())
  userId      String
  contactName String
  contactEmail String?
  relationship String  // free text: "sister", "mentor", "colleague"
  context     String  // user's own words about this person
  user        User   @relation(fields: [userId], references: [id])
}

// Immutable audit trail
model AuditLog {
  id         Int      @id @default(autoincrement())
  userId     String
  eventType  String   // 'heartbeat' | 'ciba_sent' | 'ciba_approved' | 'ciba_denied'
                      // | 'action_executed' | 'action_failed' | 'agent_cancelled'
                      // | 'setup_confirmed'
  detail     Json?
  occurredAt DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}
```

---

## Phase 1 — Setup chat agent (`lib/agent/setup-chat.ts`)

This is the onboarding conversation. The user describes their wishes;
the LLM extracts structured intent, asks clarifying questions, and on
confirmation writes to the database.

```typescript
// lib/agent/setup-chat.ts
import { streamText, tool } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("moonshotai/kimi-k2-instruct");
import { saveStagedAction } from "../db/staged-actions";
import { saveContactContext } from "../db/contact-context";
import { logAudit } from "../db/audit";

const SYSTEM_PROMPT = `
You are Vigil's setup assistant. Your job is to help the user configure what
happens when Vigil activates — when their check-ins stop.

You must extract the following from the conversation:
- Who should be contacted, how, and after how many days of silence
- Any relationship context the user shares about each contact
- Any file archiving or repository transfer wishes

Ask clarifying questions when the user is ambiguous. Be warm but concise.
Once you have enough information, confirm the full plan back to the user
in plain English before saving anything.

Only call saveAction and saveContact AFTER the user explicitly confirms.

Available services the user can connect: Gmail, Google Drive, GitHub.
Do not suggest services the user has not connected yet.
`;

export function createSetupChatHandler(
  userId: string,
  connectedServices: string[],
) {
  return async (messages: any[]) => {
    return streamText({
      model,
      system:
        SYSTEM_PROMPT + `\nConnected services: ${connectedServices.join(", ")}`,
      messages,
      tools: {
        // Tool: save a confirmed staged action to DB
        saveAction: tool({
          description:
            "Save a confirmed staged action to the database. Only call after user confirms.",
          parameters: z.object({
            triggerDays: z
              .number()
              .describe("Days of silence before this action fires"),
            actionType: z.enum([
              "gmail_send",
              "drive_archive",
              "github_transfer",
              "webhook",
            ]),
            actionConfig: z
              .record(z.any())
              .describe("Structured config for this action type"),
          }),
          execute: async ({ triggerDays, actionType, actionConfig }) => {
            await saveStagedAction({
              userId,
              triggerDays,
              actionType,
              actionConfig,
            });
            return { saved: true };
          },
        }),

        // Tool: save contact relationship context for LLM drafting later
        saveContact: tool({
          description:
            "Save relationship context for a contact. Used to draft personalized messages at activation.",
          parameters: z.object({
            contactName: z.string(),
            contactEmail: z.string().optional(),
            relationship: z.string().describe("e.g. sister, mentor, colleague"),
            context: z
              .string()
              .describe("User's own words about this person and what to say"),
          }),
          execute: async ({
            contactName,
            contactEmail,
            relationship,
            context,
          }) => {
            await saveContactContext({
              userId,
              contactName,
              contactEmail,
              relationship,
              context,
            });
            return { saved: true };
          },
        }),

        // Tool: mark setup as confirmed in audit log
        confirmSetup: tool({
          description:
            "Call this when the user has confirmed their full plan and all actions are saved.",
          parameters: z.object({
            summary: z
              .string()
              .describe("One-sentence summary of what was configured"),
          }),
          execute: async ({ summary }) => {
            await logAudit(userId, "setup_confirmed", { summary });
            return { confirmed: true };
          },
        }),
      },
    });
  };
}
```

### Example conversation flow

```
USER:   "Email my sister Priya at priya@gmail.com after a week. We grew up
         in Chennai — tell her I was happy. After a month, transfer my GitHub
         repos to arjun-dev."

VIGIL:  "Got it. A couple of questions: should I transfer all your GitHub
         repos to arjun-dev, or only specific ones? And for the email to
         Priya — any particular tone? Formal or personal?"

USER:   "All repos. Very personal, she'll be devastated."

VIGIL:  "Here's what I'll do:
         • After 7 days: email Priya (priya@gmail.com) — warm and personal,
           mentioning your time in Chennai.
         • After 30 days: transfer all GitHub repos to arjun-dev.
         Does that look right?"

USER:   "Yes, that's perfect."

VIGIL:  [calls saveAction x2, saveContact, confirmSetup]
        "Done. Vigil is now watching."
```

---

## Phase 2 — Activation agent (`lib/agent/executor.ts`)

Runs when the scheduler determines the user has been silent past the threshold
and CIBA grace has elapsed. The LLM drafts messages and reasons over execution.

```typescript
// lib/agent/executor.ts
import { generateText, tool } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import {
  getPendingStagedActions,
  markActionExecuted,
  markActionFailed,
} from "../db/staged-actions";
import { getContactContext } from "../db/contact-context";
import { logAudit } from "../db/audit";
import { getGmailToken, getDriveToken, getGithubToken } from "../auth0-ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("moonshotai/kimi-k2-instruct");

export async function triggerActivation(userId: string, silenceDays: number) {
  const actions = await getPendingStagedActions(userId, silenceDays);
  const contacts = await getContactContext(userId);

  const actionsDescription = actions
    .map(
      (a) =>
        `- Action ID ${a.id}: ${a.actionType} | config: ${JSON.stringify(a.actionConfig)}`,
    )
    .join("\n");

  const contactsDescription = contacts
    .map((c) => `- ${c.contactName} (${c.relationship}): ${c.context}`)
    .join("\n");

  await generateText({
    model,
    system: `
You are Vigil's activation agent. The user has been silent for ${silenceDays} days.
You must now execute their pre-configured wishes in order.

For Gmail actions: draft a warm, personalized farewell message using the
relationship context provided. Match the tone the user described. Do not
use generic templates.

Execute actions in order of triggerDays (ascending). If one fails, log it
and continue with the rest. Never stop the entire sequence for one failure.
    `,
    prompt: `
Pending actions:
${actionsDescription}

Contact relationship context:
${contactsDescription}

Execute each action now using the available tools.
    `,
    tools: {
      sendGmail: tool({
        description:
          "Draft and send an email via Gmail using Token Vault credentials.",
        parameters: z.object({
          actionId: z.number(),
          to: z.string(),
          subject: z.string(),
          body: z
            .string()
            .describe(
              "Fully drafted email body — personalized, not a template",
            ),
        }),
        execute: async ({ actionId, to, subject, body }) => {
          try {
            const accessToken = await getGmailToken(userId);
            const raw = btoa(
              `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain\r\n\r\n${body}`,
            )
              .replace(/\+/g, "-")
              .replace(/\//g, "_");

            const res = await fetch(
              "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ raw }),
              },
            );
            if (!res.ok) throw new Error(`Gmail error: ${res.status}`);
            await markActionExecuted(actionId);
            await logAudit(userId, "action_executed", { actionId, to });
            return { ok: true };
          } catch (err) {
            await markActionFailed(actionId);
            await logAudit(userId, "action_failed", {
              actionId,
              error: String(err),
            });
            return { ok: false, error: String(err) };
          }
        },
      }),

      transferGithubRepo: tool({
        description:
          "Transfer a GitHub repository to a new owner via Token Vault credentials.",
        parameters: z.object({
          actionId: z.number(),
          repo: z.string().describe("owner/repo-name"),
          newOwner: z.string().describe("GitHub username of heir"),
        }),
        execute: async ({ actionId, repo, newOwner }) => {
          try {
            const accessToken = await getGithubToken(userId);
            const res = await fetch(
              `https://api.github.com/repos/${repo}/transfer`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: "application/vnd.github+json",
                },
                body: JSON.stringify({ new_owner: newOwner }),
              },
            );
            if (!res.ok) throw new Error(`GitHub error: ${res.status}`);
            await markActionExecuted(actionId);
            await logAudit(userId, "action_executed", {
              actionId,
              repo,
              newOwner,
            });
            return { ok: true };
          } catch (err) {
            await markActionFailed(actionId);
            await logAudit(userId, "action_failed", {
              actionId,
              error: String(err),
            });
            return { ok: false, error: String(err) };
          }
        },
      }),

      archiveDrive: tool({
        description:
          "Archive Google Drive files to a shared folder via Token Vault credentials.",
        parameters: z.object({
          actionId: z.number(),
          targetEmail: z
            .string()
            .describe("Email to share the archive folder with"),
        }),
        execute: async ({ actionId, targetEmail }) => {
          try {
            const accessToken = await getDriveToken(userId);

            // Create a shared archive folder
            const folderRes = await fetch(
              "https://www.googleapis.com/drive/v3/files",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: "Vigil Archive",
                  mimeType: "application/vnd.google-apps.folder",
                }),
              },
            );
            if (!folderRes.ok)
              throw new Error(`Drive folder error: ${folderRes.status}`);
            const folder = await folderRes.json();

            // Share the folder with the target email
            await fetch(
              `https://www.googleapis.com/drive/v3/files/${folder.id}/permissions`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  role: "reader",
                  type: "user",
                  emailAddress: targetEmail,
                }),
              },
            );

            await markActionExecuted(actionId);
            await logAudit(userId, "action_executed", {
              actionId,
              folderId: folder.id,
            });
            return { ok: true, folderId: folder.id };
          } catch (err) {
            await markActionFailed(actionId);
            await logAudit(userId, "action_failed", {
              actionId,
              error: String(err),
            });
            return { ok: false, error: String(err) };
          }
        },
      }),
    },
    maxSteps: 20,
  });
}
```

---

## Scheduler — pure time math (`lib/scheduler/check-heartbeat.ts`)

No LLM. No agent. Just arithmetic and a CIBA push.

```typescript
// lib/scheduler/check-heartbeat.ts
import { getLastHeartbeat } from "../db/heartbeats";
import { getVigilConfig, updateCibaSentAt } from "../db/users";
import { logAudit } from "../db/audit";
import { triggerActivation } from "../agent/executor";
import { sendCIBAPush } from "../auth0-ai";

export async function checkHeartbeat(userId: string) {
  const config = await getVigilConfig(userId);

  // Skip users who are already activated or have cancelled
  if (!config || config.activatedAt || config.cancelledAt) return;

  const lastBeat = await getLastHeartbeat(userId);
  const silenceDays = (Date.now() - lastBeat.getTime()) / 86_400_000;

  // Still within threshold — nothing to do
  if (silenceDays < config.silenceDays) return;

  if (!config.cibaSentAt) {
    // First time crossing threshold — send CIBA push and record timestamp
    // The push asks: "Vigil hasn't heard from you in X days. Approve to
    // execute your instructions, or cancel to stand down."
    await sendCIBAPush(userId, silenceDays);
    await updateCibaSentAt(userId);
    await logAudit(userId, "ciba_sent", { silenceDays });
    return;
  }

  // CIBA was already sent — check if grace window has elapsed
  const graceElapsed =
    Date.now() - config.cibaSentAt.getTime() > config.graceHours * 3_600_000;

  if (graceElapsed) {
    // User did not respond — hand off to the LLM activation agent
    await triggerActivation(userId, silenceDays);
  }
}
```

**Why CIBA is split across two cron runs:** the cron job cannot hold an open
HTTP connection for 24 hours waiting for a push response. So the first run
sends the push and records `cibaSentAt`. The next run (an hour later, or
whenever the cron fires again) checks whether the grace window has elapsed.
This avoids any need for a persistent background process.

---

## API routes

### `app/api/heartbeat/route.ts`

```typescript
import { auth0 } from "@/lib/auth0";
import { recordHeartbeat } from "@/lib/db/heartbeats";
import { logAudit } from "@/lib/db/audit";

export async function POST() {
  const session = await auth0.getSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  await recordHeartbeat(session.user.sub);
  await logAudit(session.user.sub, "heartbeat", {});
  return Response.json({ ok: true, timestamp: new Date().toISOString() });
}
```

### `app/api/chat/route.ts` — setup conversation (streaming)

```typescript
import { auth0 } from "@/lib/auth0";
import { getConnectedServices } from "@/lib/db/users";
import { createSetupChatHandler } from "@/lib/agent/setup-chat";

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await req.json();
  const connectedServices = await getConnectedServices(session.user.sub);
  const handler = createSetupChatHandler(session.user.sub, connectedServices);

  return handler(messages);
}
```

### `app/api/cron/check/route.ts`

```typescript
import { getAllActiveUsers } from "@/lib/db/users";
import { checkHeartbeat } from "@/lib/scheduler/check-heartbeat";

export async function GET(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await getAllActiveUsers();
  await Promise.all(users.map((u) => checkHeartbeat(u.id)));
  return Response.json({ checked: users.length });
}
```

### `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/check",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## Auth0 setup (`lib/auth0-ai.ts`)

```typescript
import { Auth0AI, getAccessTokenForConnection } from "@auth0/ai-vercel";
import { getRefreshToken, getUser } from "./auth0";

const auth0AI = new Auth0AI();

// Token Vault fetchers — called at execution time only, never stored locally
export const getGmailToken = (userId: string) =>
  getAccessTokenForConnection({
    connection: process.env.GOOGLE_CONNECTION_NAME!,
    scopes: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/drive.file",
    ],
    refreshToken: getRefreshToken,
  });

export const getDriveToken = (userId: string) =>
  getAccessTokenForConnection({
    connection: process.env.GOOGLE_CONNECTION_NAME!,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
    refreshToken: getRefreshToken,
  });

export const getGithubToken = (userId: string) =>
  getAccessTokenForConnection({
    connection: process.env.GITHUB_CONNECTION_NAME!,
    scopes: ["repo"],
    refreshToken: getRefreshToken,
  });

// CIBA push — sends a Guardian push notification to the user's phone
export const sendCIBAPush = auth0AI.withAsyncUserConfirmation({
  userID: async () => {
    const user = await getUser();
    return user?.sub as string;
  },
  bindingMessage: async ({ silenceDays }: { silenceDays: number }) =>
    `Vigil: no check-in for ${Math.floor(silenceDays)} days. Approve to execute your instructions, or cancel to stand down.`,
  audience: process.env.AUTH0_AUDIENCE!,
  scopes: ["openid"],
  onAuthorizationRequest: "block",
  onUnauthorized: async () => "cancelled",
});
```

---

## Dashboard UI — screens

### Screen 1: Home (`/dashboard`)

- Large status indicator: **WATCHING** / **ALERT SENT** / **STANDING DOWN**
- "Last check-in: X hours ago" with a pulsing dot
- Prominent **Check in** button — calls `POST /api/heartbeat`
- Summary of configured actions (read-only)
- Audit log below

### Screen 2: Setup chat (`/dashboard/setup`)

- Full-page chat interface — clean, minimal
- System message: "Tell me what you'd like Vigil to do. Who should I contact? What should happen to your files and repos?"
- Streams responses from `/api/chat`
- On `confirmSetup` tool call, shows a "Plan saved" confirmation and redirects to home

### Screen 3: Connect accounts (`/dashboard/connect`)

- Cards for Gmail, Google Drive, GitHub
- Each shows connected / disconnected state
- Connect triggers Auth0 Connected Accounts flow (Token Vault)
- Shows granted scopes per connection

---

## Complete data flow

```
ONBOARDING
  User logs in (Auth0 OIDC)
  → Connects Gmail, GitHub (Token Vault stores tokens — Vigil never sees them)
  → Chats with setup agent → intent extracted → staged_actions + contact_context written
  → First heartbeat recorded

NORMAL OPERATION
  User visits dashboard or any page → heartbeat recorded automatically
  OR user clicks Check In → POST /api/heartbeat

SILENCE DETECTED  [cron, no LLM]
  Every hour: NOW() - last_heartbeat > silence_days?
    No  → do nothing
    Yes, ciba not yet sent → send CIBA Guardian push, record cibaSentAt
    Yes, ciba sent, grace elapsed, not cancelled → call triggerActivation()

USER RESPONDS TO CIBA PUSH
  Approve  → ciba_approved logged → activation proceeds
  Cancel   → cancelledAt set → all staged_actions marked cancelled
  No reply → after graceHours → activation proceeds regardless

ACTIVATION  [LLM agent]
  executor.ts receives: pending staged_actions + contact_context
  LLM reasons over execution order
  For each Gmail action:
    → LLM drafts personalized message using relationship context
    → Calls sendGmail tool → fetches token from Token Vault at runtime
    → Gmail API call executes → action marked executed → audit logged
  For each GitHub action:
    → Calls transferGithubRepo tool → fetches token from Token Vault
    → GitHub API call executes → audit logged
  For each Drive action:
    → Calls archiveDrive tool → fetches token from Token Vault
    → Shared folder created → audit logged
  Token is short-lived, never persisted anywhere

AUDIT
  Every event written to audit_log — heartbeats, CIBA events, tool calls,
  action results. Token values never appear in logs.
```

---

## Security properties to highlight in submission

- **Zero token-at-rest:** Vigil never stores OAuth credentials locally.
  Token Vault holds them; the agent fetches a short-lived token only at
  execution time via a secure token exchange.
- **Double-confirm design:** CIBA push gives the user a final chance to cancel.
  The agent cannot fire unilaterally without the grace window elapsing.
- **Minimal scopes:** each tool requests only what it needs —
  `gmail.send` not `gmail.full`, `drive.file` not `drive`.
- **Immutable audit log:** every event is written without token values.
  Inspectable by judges to verify no credential leakage.
- **Revocable instantly:** disconnecting an account from the dashboard
  revokes via Token Vault — Vigil loses access to that service immediately,
  even mid-execution.
- **Clean AI/cron separation:** the LLM touches nothing in the silence
  detection path. Cron is pure arithmetic. This is a defensible,
  production-aware architecture.

---

## Environment variables

```bash
# Auth0
AUTH0_SECRET=
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_DOMAIN.auth0.com
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_AUDIENCE=https://vigil.api
GOOGLE_CONNECTION_NAME=google-oauth2
GITHUB_CONNECTION_NAME=github

# Database
DATABASE_URL=postgresql://...

# LLM (Groq)
GROQ_API_KEY=
# Model: moonshotai/kimi-k2-instruct
# Fallback: meta-llama/llama-4-scout-17b-16e-instruct

# Cron auth
CRON_SECRET=
```

---

## Build order (recommended)

1. Auth0 OIDC login working end-to-end
2. Token Vault — connect Gmail, connect GitHub, verify token fetch works
3. Database schema + Prisma migrations
4. `POST /api/heartbeat` + Check In button
5. Scheduler (`check-heartbeat.ts`) with short thresholds for local testing
6. Gmail tool — simplest action, easiest to demo
7. Setup chat agent (`/api/chat`) + chat UI
8. CIBA activation gate
9. GitHub tool + Drive tool
10. Activation agent (`executor.ts`) with LLM drafting
11. Audit log UI
12. Dashboard polish + demo recording

---

## Demo script (3 minutes)

**0:00 – 0:30**
Open the setup chat. Type: "Email my sister Priya at priya@gmail.com after
a week — we grew up together, tell her I was happy. Transfer my GitHub repos
to arjun-dev after a month." Show Vigil asking a clarifying question
("All repos?"), confirm, watch it save.

**0:30 – 1:00**
Show the dashboard home — WATCHING state, last heartbeat timestamp,
configured action summary.

**1:00 – 1:45**
Fast-forward the scheduler (call cron endpoint directly with zeroed threshold).
Show the CIBA Guardian push arriving on phone. Tap Cancel — dashboard flips
to STANDING DOWN, audit log records `ciba_denied`.

**1:45 – 2:30**
Reset. Repeat fast-forward. This time let the push expire. Show the activation
agent firing: LLM drafts a personalized email to Priya using the relationship
context, sends it via Gmail. Show the delivered email. Show audit log — no
token values anywhere.

**2:30 – 3:00**
Show the audit log in full. Close with:
"Vigil never holds your credentials. The LLM writes what you meant to say.
Auth0 Token Vault holds what it needs to send it. And it only acts when
you're no longer there to stop it."
