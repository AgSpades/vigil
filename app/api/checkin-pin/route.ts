import { auth0 } from "@/lib/auth0";
import { logAudit } from "@/lib/db/audit";
import {
  ensureVigilConfig,
  getUserCheckinSecurity,
  isSecureCheckinSchemaReady,
  setUserPin,
  upsertUser,
} from "@/lib/db/users";
import { hash } from "bcryptjs";
import { z } from "zod";

const setPinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/),
});

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schemaReady = await isSecureCheckinSchemaReady();
  if (!schemaReady) {
    return Response.json({ hasPin: false, schemaReady: false });
  }

  const security = await getUserCheckinSecurity(session.user.sub);
  return Response.json({ hasPin: Boolean(security?.pinHash) });
}

export async function POST(request: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = setPinSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
      { error: "PIN must be 4 to 6 digits." },
      { status: 400 },
    );
  }

  const userId = session.user.sub;
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

  const pinHash = await hash(parsed.data.pin, 12);
  await setUserPin(userId, pinHash);
  await logAudit(userId, "checkin_pin_set", {});

  return Response.json({ ok: true });
}
