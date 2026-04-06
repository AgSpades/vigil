"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import {
  CONNECTED_SERVICES,
  getAccountForService,
  getConnectedServicesFromAccounts,
  getConnectAccountHref,
} from "@/lib/auth0-connected-accounts";
import type { ConnectedAccountSummary } from "@/lib/auth0-my-account";

export function ConnectedAccounts({
  initialAccounts = [],
  returnTo = "/dashboard/connect",
  allowDisconnect = true,
}: {
  initialAccounts?: ConnectedAccountSummary[];
  returnTo?: string;
  allowDisconnect?: boolean;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connected = useMemo(
    () => getConnectedServicesFromAccounts(accounts),
    [accounts],
  );

  async function handleDisconnect(account: ConnectedAccountSummary) {
    setPendingAccountId(account.id);
    setError(null);

    try {
      const response = await fetch("/api/connections", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: account.id,
          connection: account.connection,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to disconnect account");
      }

      setAccounts((current) =>
        current.filter((entry) => entry.id !== account.id),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect account",
      );
    } finally {
      setPendingAccountId(null);
    }
  }

  return (
    <div className="grid gap-4">
      {error ? (
        <div className="rounded-xl border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {CONNECTED_SERVICES.map((service) => {
        const account = getAccountForService(accounts, service);
        const isConnected = connected.includes(service.id) && account;

        return (
          <div
            key={service.id}
            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900"
          >
            <div className="min-w-0">
              <p className="font-semibold text-zinc-100">{service.name}</p>
              <p className="text-sm text-zinc-400">{service.description}</p>
              {account ? (
                <p className="mt-2 text-xs text-zinc-500 break-words">
                  Granted: {account.scopes.join(", ")}
                </p>
              ) : null}
            </div>

            {isConnected ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800">
                  Connected
                </span>
                {allowDisconnect ? (
                  <Button
                    type="button"
                    variant="danger-ghost"
                    disabled={pendingAccountId === account.id}
                    className="!h-[34px] !px-4 text-[11px]"
                    onClick={() => handleDisconnect(account)}
                  >
                    {pendingAccountId === account.id ? "Removing" : "Disconnect"}
                  </Button>
                ) : null}
              </div>
            ) : (
              <a
                href={getConnectAccountHref(service, returnTo)}
                className="text-xs font-medium px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors shrink-0"
              >
                Connect
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
