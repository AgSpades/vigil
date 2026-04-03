import { auth0 } from "@/lib/auth0";
import { triggerActivation } from "@/lib/agent/executor";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // Allow either an authenticated session or internal cron secret
  const cronSecret = req.headers.get("x-cron-secret");
  const isInternal = cronSecret === process.env.CRON_SECRET;

  if (!isInternal) {
    const session = await auth0.getSession();
    if (!session)
      return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, silenceDays } = await req.json();
  if (!userId || typeof silenceDays !== "number") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Fire and forget — activation can take time
  triggerActivation(userId, silenceDays).catch(console.error);

  return Response.json({ ok: true });
}
