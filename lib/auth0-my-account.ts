import { auth0 } from "@/lib/auth0";

export type ConnectedAccountSummary = {
  id: string;
  connection: string;
  scopes: string[];
  accessType?: string;
  createdAt?: string;
  expiresAt?: string;
};

function getMyAccountAudience() {
  const domain = process.env.AUTH0_DOMAIN;

  if (!domain) {
    throw new Error("AUTH0_DOMAIN is required");
  }

  return `https://${domain}/me/`;
}

function getMyAccountEndpoint(path = "") {
  const domain = process.env.AUTH0_DOMAIN;

  if (!domain) {
    throw new Error("AUTH0_DOMAIN is required");
  }

  return `https://${domain}/me/v1/connected-accounts${path}`;
}

async function getMyAccountToken(scope: string) {
  const accessToken = await auth0.getAccessToken({
    audience: getMyAccountAudience(),
    scope,
  });

  return accessToken.token;
}

export async function fetchConnectedAccounts(): Promise<ConnectedAccountSummary[]> {
  const token = await getMyAccountToken("read:me:connected_accounts");

  const response = await fetch(getMyAccountEndpoint(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch connected accounts: ${response.status} ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as Array<Record<string, unknown>>;

  return payload.map((account) => ({
    id: String(account.id),
    connection: String(account.connection),
    scopes: Array.isArray(account.scopes)
      ? account.scopes.map((scope) => String(scope))
      : [],
    accessType:
      typeof account.access_type === "string"
        ? account.access_type
        : typeof account.accessType === "string"
          ? account.accessType
          : undefined,
    createdAt:
      typeof account.created_at === "string"
        ? account.created_at
        : typeof account.createdAt === "string"
          ? account.createdAt
          : undefined,
    expiresAt:
      typeof account.expires_at === "string"
        ? account.expires_at
        : typeof account.expiresAt === "string"
          ? account.expiresAt
          : undefined,
  }));
}

export async function disconnectConnectedAccount(accountId: string) {
  const token = await getMyAccountToken("delete:me:connected_accounts");

  const response = await fetch(getMyAccountEndpoint(`/${accountId}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(
      `Failed to disconnect account: ${response.status} ${await response.text()}`,
    );
  }
}
