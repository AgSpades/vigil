import { auth0 } from "@/lib/auth0";

export type ConnectedAccountSummary = {
  id: string;
  connection: string;
  scopes: string[];
  accessType?: string;
  createdAt?: string;
  expiresAt?: string;
};

function parseScopes(scope: unknown): string[] {
  if (Array.isArray(scope)) {
    return scope.map((value) => String(value).trim()).filter(Boolean);
  }

  if (typeof scope !== "string") {
    return [];
  }

  return scope
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function getTokenSetScope(tokenSet: Record<string, unknown>): unknown {
  if (typeof tokenSet.scope === "string" || Array.isArray(tokenSet.scope)) {
    return tokenSet.scope;
  }

  if (
    typeof tokenSet.requestedScope === "string" ||
    Array.isArray(tokenSet.requestedScope)
  ) {
    return tokenSet.requestedScope;
  }

  return undefined;
}

export async function fetchConnectedAccounts(options?: {
  probeConnections?: string[];
}): Promise<ConnectedAccountSummary[]> {
  const session = await auth0.getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const uniqueConnections = Array.from(
    new Set((options?.probeConnections ?? []).filter(Boolean)),
  );

  // In route handlers, probing here materializes connection token sets right after /auth/connect callback.
  for (const connection of uniqueConnections) {
    try {
      await auth0.getAccessTokenForConnection({ connection });
    } catch {
      // Ignore probe failures for non-connected providers.
    }
  }

  const refreshedSession =
    uniqueConnections.length > 0 ? await auth0.getSession() : session;
  const tokenSets =
    refreshedSession?.connectionTokenSets ?? session.connectionTokenSets ?? [];

  return tokenSets.map((tokenSet, index) => {
    const normalizedTokenSet = tokenSet as Record<string, unknown>;
    const connection =
      typeof normalizedTokenSet.connection === "string"
        ? normalizedTokenSet.connection
        : "unknown-connection";

    return {
      id: `session:${connection}:${index}`,
      connection,
      scopes: parseScopes(getTokenSetScope(normalizedTokenSet)),
      accessType: "offline",
      expiresAt:
        typeof normalizedTokenSet.expiresAt === "number"
          ? new Date(normalizedTokenSet.expiresAt * 1000).toISOString()
          : undefined,
    };
  });
}

export async function disconnectConnectedAccount(accountId: string) {
  if (accountId.startsWith("session:")) {
    throw new Error(
      "Disconnect is not available for session-backed connected accounts in this tenant setup.",
    );
  }

  throw new Error("Disconnect is not available in the current Auth0 SDK flow.");
}
