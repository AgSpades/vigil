import { auth0 } from "@/lib/auth0";
import { logAudit } from "@/lib/db/audit";
import { cancelStagedActionById } from "@/lib/db/staged-actions";

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const actionId = Number(id);

  if (!Number.isInteger(actionId) || actionId <= 0) {
    return Response.json({ error: "Invalid action id" }, { status: 400 });
  }

  const cancelled = await cancelStagedActionById(
    session.user.sub,
    actionId,
    session.user.email,
  );
  if (!cancelled) {
    return Response.json(
      { error: "Action not found or already finalized" },
      { status: 404 },
    );
  }

  await logAudit(session.user.sub, "task_cancelled", {
    actionId,
    reason: "user_cancelled_from_dashboard",
  });

  return Response.json({ ok: true, cancelledActionId: actionId });
}
