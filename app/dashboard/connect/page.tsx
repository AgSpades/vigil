import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getConnectedServices } from "@/lib/db/users";
import { ConnectedAccounts } from "@/components/ConnectedAccounts";
import Link from "next/link";

export default async function ConnectPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");

  const connected = await getConnectedServices(session.user.sub);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-bold text-zinc-100 tracking-tight"
        >
          Vigil
        </Link>
        <span className="text-sm text-zinc-500">Connect accounts</span>
      </nav>

      <main className="max-w-lg mx-auto w-full px-6 py-12 space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">
            Connected Accounts
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Vigil never sees your credentials. Auth0 Token Vault stores them
            and only releases short-lived tokens at execution time.
          </p>
        </div>

        <ConnectedAccounts connected={connected} />

        <p className="text-xs text-zinc-600 text-center">
          Disconnecting an account immediately revokes Vigil&apos;s access,
          even mid-execution.
        </p>
      </main>
    </div>
  );
}
