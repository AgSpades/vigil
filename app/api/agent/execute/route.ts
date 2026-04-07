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

  const { userId, elapsedMinutes, silenceDays } = await req.json();
  const resolvedElapsedMinutes =
    typeof elapsedMinutes === "number"
      ? elapsedMinutes
      : typeof silenceDays === "number"
        ? silenceDays * 1_440
        : null;

  if (!userId || typeof resolvedElapsedMinutes !== "number") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Fire and forget — activation can take time
  triggerActivation(userId, resolvedElapsedMinutes).catch(console.error);

  return Response.json({ ok: true });
}
