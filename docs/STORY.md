# Vigil — Project Story

## What inspired this

There's a specific kind of problem nobody seems to have solved cleanly. You spend years building things — repositories, documents, relationships maintained through inboxes — and there's no plan for what happens to any of it if you suddenly can't act. Legal wills exist. Password managers can be handed to
family. But neither of these can _do anything_. They require someone on the other end who knows what to look for and what to do with it. Most people don't.

The hackathon theme was "Authorized to Act." I kept thinking about what that phrase means when the person doing the authorizing is gone. Not gone as in offline for a few hours — gone. That's a harder version of the delegation problem, and it's one where the security architecture actually matters. Most
submissions, I figured, would build assistant chatbots that read calendars on command. I wanted to build something where the authorization problem was the product, not plumbing underneath it.

The dead man's switch model came from that. The question isn't "how do I let an agent act?" — it's "how do I let an agent act only when I'm gone, only with what I gave it, and only after giving me one last chance to stop it?" That's a more interesting problem. Auth0's Token Vault turned out to be the right tool
for it.

---

## What we built

Vigil is a digital estate agent. You connect Gmail, Google Drive, and GitHub through Auth0 Token Vault, then have a conversation with an AI agent about what you want to happen to each of them. Not a form. A conversation. You say something like "email my sister Priya after a week — we grew up in Chennai,
tell her I was happy" and the agent figures out the structure, asks if it's missing anything, and confirms the plan before writing anything to the database.

After that, Vigil goes silent. It checks one thing every hour: when did we last see this user? If that gap crosses a threshold, it sends a push notification through Auth0 Guardian: "Vigil hasn't heard from you in 7 days. Approve to proceed, or cancel to stand down." Cancel, and everything stops. No response
after the grace window, and the agent wakes up.

At that point the AI actually earns its place. It receives the stored instructions, the relationship context the user wrote during setup, and drafts a personalized farewell message for each contact — using their own words, not a template. The repos get transferred. The Drive gets archived. The audit log records every action and every token fetch without ever writing a credential value anywhere.

The thing I keep coming back to: most agents act when you tell them to. Vigil acts when you stop.

---

## How I built it

Next.js 16 for the full stack, Vercel for deployment and cron jobs. Auth0 handles login and Token Vault holds every OAuth credential — the app's database never sees a token. CIBA drives the push confirmation. Groq runs the LLM (`moonshotai/kimi-k2-instruct`), which handles multi-tool calls reliably and fits within free tier limits without drama. Postgres stores the config: atest heartbeat timestamp (last_seen derived from heartbeat history), staged actions, contact context, audit log.

The AI touches exactly two parts of the system. During setup it extracts structured intent from natural language. At activation it drafts messages and reasons over execution order. The cron job that detects silence has no LLM near it — it does time arithmetic and hands off. That wasn't clever engineering,
it was the obvious answer once you ask "what is this component actually responsible for?" A cron job deciding someone is "probably dead" based on behavioral patterns is a different product with different problems. Math is cleaner.

The data model ended up simpler than expected. No vector database, no embeddings. The only query that matters for the core loop is "when was this user last seen?" — one indexed timestamp answers it. We used the time saved there on getting the CIBA grace window logic right.

---

## Challenges

The CIBA timing problem took longer than it should have. Auth0's async authorization blocks until the user responds — send the push, poll the token endpoint, get an answer. That works in a live session. It doesn't work when you might need to wait 24 hours. The solution is to split across two cron runs:
first run sends the push and records the timestamp, second run checks whether the grace window elapsed and `cancelled_at` is still null. Simple in retrospect. I spent an embarrassing amount of time staring at it before the answer was obvious.

Token Vault configuration is not obvious from the documentation. The SDK is well documented. The dashboard setup is scattered across four different locations — enabling Token Vault on each social connection, creating an API audience, enabling the Token Vault grant type on the application — none of
which are in the same place or linked to each other. If any one piece is missing, the connect account flow throws a generic error. I hit all of them.

The harder challenge was deciding where AI belongs in the system and being honest about it. The first version of this project had no real AI — it was a cron job and a switch statement. The setup chat and the message drafting at activation are where the LLM does work nothing else could do. Getting that boundary clear took more time than writing the code on either side of it.

There's also something uncomfortable about building a system that acts after you're gone. The auth architecture handles the credential side well. But trust is harder than credentials. The audit log helps. The CIBA cancellation path helps. The fact that tokens are structurally impossible to log helps. Whether
it adds up to enough — I'm genuinely not sure. That's probably the right answer to have at the end of a project like this.

---

## What I have learned

Auth0 Token Vault is good at the thing it's designed for. The token exchange pattern — agent requests access, vault issues a short-lived credential, credential is used and discarded — is the right model for agents that take real-world action. Storing refresh tokens yourself is something to avoid if you can. This project would have been harder and worse if I had tried.

Groq's free tier is viable for a working MVP if you pick the right model. Kimi K2 handles agentic tool calls well and the token limits don't bite you on short conversations.

The hardest decisions weren't technical. Whether the cron should contain AI. Whether the CIBA push should retry or fire once. Whether token values should be impossible to log or just unlikely. These were product decisions, and they shaped the architecture more than the architecture shaped them.

---

## The math behind the timing

The silence detection is just this:

$$\text{silence} = \frac{t_{\text{now}} - t_{\text{last\_seen}}}{\text{86,400,000 ms}}$$

If $\text{silence} \geq d_{\text{threshold}}$ and no CIBA push has been sent:

$$\text{send CIBA push}, \quad t_{\text{ciba}} = t_{\text{now}}$$

On the next cron run, the activation condition is:

$$\text{activate} \iff \left(t_{\text{now}} - t_{\text{ciba}} > g_{\text{grace}}\right) \land \left(t_{\text{cancelled}} = \text{null}\right)$$

Where $g_{\text{grace}}$ is the grace window in milliseconds. No model, no inference, no probability — just arithmetic on two timestamps. The LLM isnowhere near this path.

---

## What's next

Vigil works. The core loop — check in, go silent, get pushed, agent fires — is solid. But we know what's missing, and some of it isn't small.

Service coverage is the most immediate thing. Gmail, Drive, and GitHub are what we shipped. People's digital lives don't stop there. Notion documents, domain registrations, Substack subscriber lists, Figma files, crypto wallets. Each is a different OAuth provider and a different API to learn at activation time.
Adding them isn't hard in principle — Token Vault handles the credential side uniformly regardless of provider — but each integration has its own failure modes and each one needs real testing. "Transfer repo ownership" fails in specific ways that "send an email" doesn't.

We'd rather add three services properly than ten services badly.

The check-in experience needs to change. Right now it's a button on a dashboard, which means you have to remember to open the dashboard. That's a bad model for something whose entire value depends on you actually doing it consistently. A browser extension that registers a check-in passively when you use your computer, or a mobile app with a simple biometric tap — something that fits how you already live rather than adding a ritual you have to maintain on top of everything else. We didn't ship this because it's a separate product surface and the hackathon had a deadline.

The notification channel is also a real constraint. CIBA currently requires Auth0 Guardian, which means "install this MFA app" is part of onboarding. For a product whose entire activation model depends on that push actually reaching someone, that's not a small ask. Auth0 has email and SMS channels on their
roadmap. When those land, the barrier drops significantly.

Conditional instructions are further out but they matter. The current model is a flat list: day 7, do X. Day 30, do Y. Real wishes are messier — "if my repos haven't been touched in two years, archive them instead of transferring."

The setup agent can already interpret that kind of language. The gap is on the storage and evaluation side: how do you represent a condition in the database and check it correctly at activation time without it becoming its own programming language. Solvable, but not trivial.

The trust problem doesn't fit on a roadmap. It's not a feature. It's the question of whether someone would actually configure this, actually believe it would work, actually feel okay about an AI sending messages on their behalf after they're gone. The audit log and the CIBA gate are real answers. They're
not complete ones. Honestly, I am not sure what the complete answer looks like. That's probably something you figure out from talking to people who've lost someone and watching what they actually needed — not from building in a vacuum over a hackathon weekend.

---

_Vigil never holds your credentials. The LLM writes what you meant to say. Auth0 Token Vault holds what it needs to send it. And it only acts when you're no longer there to stop it._
