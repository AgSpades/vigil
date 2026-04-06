import { auth0 } from "@/lib/auth0";
import { CONNECTED_SERVICES } from "@/lib/auth0-connected-accounts";
import {
  disconnectConnectedAccount,
  fetchConnectedAccounts,
} from "@/lib/auth0-my-account";
import { logAudit } from "@/lib/db/audit";

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

  const { id, connection } = (await req.json()) as {
    id?: string;
    connection?: string;
  };

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
    await logAudit(session.user.sub, "connection_removed", {
      accountId: id,
      connection,
    });
    return Response.json({ ok: true });
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
