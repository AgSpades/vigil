type SessionWithConnectionTokens =
  | {
      connectionTokenSets?: Array<{
        connection: string;
        scope?: string;
      }>;
    }
  | null
  | undefined;

export type ConnectedServiceId = "gmail" | "drive" | "github";

export type ConnectedServiceDefinition = {
  id: ConnectedServiceId;
  name: string;
  description: string;
  connectionName: string;
  scopes: string[];
};

export const CONNECTED_SERVICES: ConnectedServiceDefinition[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Send farewell emails to your contacts",
    connectionName: "google-oauth2",
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
  },
  {
    id: "drive",
    name: "Google Drive",
    description: "Archive and share your files",
    connectionName: "google-oauth2",
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  },
  {
    id: "github",
    name: "GitHub",
    description: "Transfer repository ownership",
    connectionName: "github",
    scopes: ["repo"],
  },
];

function normalizeScopes(scope: string | undefined): Set<string> {
  return new Set(
    (scope ?? "")
      .split(/[,\s]+/)
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function hasRequiredScopes(
  grantedScope: string | undefined,
  requiredScopes: string[],
): boolean {
  const granted = normalizeScopes(grantedScope);
  return requiredScopes.every((scope) => granted.has(scope));
}

export function getConnectedServicesFromSession(
  session: SessionWithConnectionTokens,
): ConnectedServiceId[] {
  const tokenSets = session?.connectionTokenSets ?? [];

  return CONNECTED_SERVICES.filter((service) =>
    tokenSets.some(
      (tokenSet) =>
        tokenSet.connection === service.connectionName &&
        hasRequiredScopes(tokenSet.scope, service.scopes),
    ),
  ).map((service) => service.id);
}

export function getConnectedServicesFromAccounts(
  accounts: ConnectedAccountSummary[],
): ConnectedServiceId[] {
  return CONNECTED_SERVICES.filter((service) =>
    accounts.some(
      (account) =>
        account.connection === service.connectionName &&
        hasRequiredScopes(account.scopes.join(" "), service.scopes),
    ),
  ).map((service) => service.id);
}

export function getAccountForService(
  accounts: ConnectedAccountSummary[],
  service: ConnectedServiceDefinition,
): ConnectedAccountSummary | undefined {
  return accounts.find(
    (account) =>
      account.connection === service.connectionName &&
      hasRequiredScopes(account.scopes.join(" "), service.scopes),
  );
}

export function getConnectAccountHref(
  service: ConnectedServiceDefinition,
  returnTo: string,
): string {
  const params = new URLSearchParams({
    connection: service.connectionName,
    returnTo,
  });

  for (const scope of service.scopes) {
    params.append("scopes", scope);
  }

  return `/auth/connect?${params.toString()}`;
}
import type { ConnectedAccountSummary } from "@/lib/auth0-my-account";
