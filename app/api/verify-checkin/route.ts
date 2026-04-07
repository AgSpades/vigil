import { auth0 } from "@/lib/auth0";
import { logAudit } from "@/lib/db/audit";
import { recordHeartbeat } from "@/lib/db/heartbeats";
import {
  ensureVigilConfig,
  getUserCheckinSecurity,
  isSecureCheckinSchemaReady,
  markCheckinFailure,
  markCheckinSuccess,
  upsertUser,
} from "@/lib/db/users";
import { consumeRateLimit } from "@/lib/rate-limit";
import { compare } from "bcryptjs";
import { z } from "zod";

const verifySchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/),
  source: z.enum(["browser", "email", "mobile"]).optional(),
});

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.sub;
  const source = request.headers.get("x-checkin-source") ?? "browser";

  const rateKey = `${userId}:${source}`;
  const rate = consumeRateLimit(rateKey, 30, 60_000);
  if (!rate.allowed) {
    return Response.json(
      {
        error: "Too many requests. Please retry shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)),
        },
      },
    );
  }

  const parsed = verifySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  await upsertUser(userId, session.user.email ?? "");
  await ensureVigilConfig(userId);

  const schemaReady = await isSecureCheckinSchemaReady();
  if (!schemaReady) {
    return Response.json(
      {
        error: "Secure check-in is temporarily unavailable. Please run database migrations.",
      },
      { status: 503 },
    );
  }

  const security = await getUserCheckinSecurity(userId);
  if (!security?.pinHash) {
    return Response.json(
      { error: "PIN not configured. Set your check-in PIN first." },
      { status: 428 },
    );
  }

  if (security.lockUntil && security.lockUntil.getTime() > Date.now()) {
    const retryAfterSeconds = Math.ceil(
      (security.lockUntil.getTime() - Date.now()) / 1000,
    );
    return Response.json(
      {
        error: "PIN entry is temporarily locked.",
      },
      {
        status: 423,
        headers: { "Retry-After": String(retryAfterSeconds) },
      },
    );
  }

  const isValid = await compare(parsed.data.pin, security.pinHash);
  if (!isValid) {
    const failure = await markCheckinFailure(userId, 5, 15);
    await logAudit(userId, "checkin_failed", {
      source: parsed.data.source ?? "browser",
      failedAttempts: failure.failedAttempts,
      lockUntil: failure.lockUntil?.toISOString() ?? null,
    });

    if (failure.lockUntil && failure.lockUntil.getTime() > Date.now()) {
      const retryAfterSeconds = Math.ceil(
        (failure.lockUntil.getTime() - Date.now()) / 1000,
      );
      return Response.json(
        {
          error: "Too many failed attempts. PIN entry is locked for 15 minutes.",
        },
        {
          status: 423,
          headers: { "Retry-After": String(retryAfterSeconds) },
        },
      );
    }

    return Response.json({ error: "Invalid PIN" }, { status: 401 });
  }

  await markCheckinSuccess(userId);
  await recordHeartbeat(userId);
  await logAudit(userId, "checkin_verified", {
    source: parsed.data.source ?? "browser",
  });

  return Response.json({ ok: true, timestamp: new Date().toISOString() });
}
