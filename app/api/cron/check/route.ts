import { getAllActiveUsers } from "@/lib/db/users";
import { checkHeartbeat } from "@/lib/scheduler/check-heartbeat";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await getAllActiveUsers();
  await Promise.all(users.map((u) => checkHeartbeat(u.id)));
  return Response.json({ checked: users.length });
}
