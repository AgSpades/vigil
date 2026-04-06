import { auth0 } from "@/lib/auth0";
import { getStagedActions } from "@/lib/db/staged-actions";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actions = await getStagedActions(session.user.sub);
  return Response.json({ actions });
}
