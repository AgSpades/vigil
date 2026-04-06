import { auth0 } from "@/lib/auth0";
import { CONNECTED_SERVICES } from "@/lib/auth0-connected-accounts";
import {
  disconnectConnectedAccount,
  fetchConnectedAccounts,
} from "@/lib/auth0-my-account";
import { logAudit } from "@/lib/db/audit";
import { cancelPendingActionsForServices } from "@/lib/db/staged-actions";

function normalizeScopes(scopes: unknown): string[] {
  if (!Array.isArray(scopes)) {
    return [];
  }

  return scopes.filter((scope): scope is string => typeof scope === "string");
}

function inferServicesFromDisconnectPayload(payload: {
  connection?: string;
  scopes?: string[];
}) {
  const services = new Set<"gmail" | "drive" | "github">();
  const scopes = new Set(payload.scopes ?? []);

  if (payload.connection === "github") {
    services.add("github");
  }

  if (payload.connection === "google-oauth2") {
    if (
      scopes.size === 0 ||
      scopes.has("https://www.googleapis.com/auth/gmail.send")
    ) {
      services.add("gmail");
    }

    if (
      scopes.size === 0 ||
      scopes.has("https://www.googleapis.com/auth/drive.file")
    ) {
      services.add("drive");
    }
  }

  return Array.from(services);
}

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const probeConnections = Array.from(
      new Set(CONNECTED_SERVICES.map((service) => service.connectionName)),
    );

    const accounts = await fetchConnectedAccounts({ probeConnections });
    return Response.json({ accounts });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load connected accounts",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as {
    id?: string;
    connection?: string;
    scopes?: unknown;
  };
  const { id, connection } = payload;
  const scopes = normalizeScopes(payload.scopes);

  if (!id) {
    return Response.json({ error: "Missing account id" }, { status: 400 });
  }

  if (id.startsWith("session:")) {
    return Response.json(
      {
        error:
          "Disconnect is not available for session-backed connected accounts in this tenant setup.",
      },
      { status: 400 },
    );
  }

  try {
    await disconnectConnectedAccount(id);
    const disconnectedServices = inferServicesFromDisconnectPayload({
      connection,
      scopes,
    });
    const cancelledCount = await cancelPendingActionsForServices(
      session.user.sub,
      disconnectedServices,
    );

    await logAudit(session.user.sub, "connection_removed", {
      accountId: id,
      connection,
      scopes,
      cancelledPendingActions: cancelledCount,
      disconnectedServices,
    });

    if (cancelledCount > 0) {
      await logAudit(session.user.sub, "tasks_cancelled", {
        reason: "service_disconnected",
        cancelledPendingActions: cancelledCount,
        disconnectedServices,
      });
    }

    return Response.json({
      ok: true,
      cancelledPendingActions: cancelledCount,
      disconnectedServices,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to disconnect account",
      },
      { status: 500 },
    );
  }
}
