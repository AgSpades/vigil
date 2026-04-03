import { auth0 } from "@/lib/auth0";
import { getAuditLogs } from "@/lib/db/audit";

export async function GET() {
  const session = await auth0.getSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await getAuditLogs(session.user.sub);
  return Response.json(logs);
}
