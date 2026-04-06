import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { auth0 } from "@/lib/auth0";
import { fetchConnectedAccounts } from "@/lib/auth0-my-account";
import { ConnectedAccounts } from "@/components/ConnectedAccounts";

export default async function ConnectPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const accounts = await fetchConnectedAccounts().catch(() => []);

  return (
    <main className="min-h-[calc(100vh-72px)] bg-vigil-bgPri flex flex-col items-center justify-center p-6 text-vigil-textPri relative fade-up">
      <div className="absolute top-8 right-8 text-[11px] font-sans uppercase tracking-[0.16em] text-vigil-textSec">
        STEP 1 OF 2 — CONNECT
      </div>

      <div className="w-full max-w-[560px]">
        <h1 className="font-serif text-[40px] font-light mb-4">
          Connect your accounts.
        </h1>
        <p className="text-[15px] text-vigil-textSec font-light mb-12">
          Vigil needs scoped access to carry out your instructions. Your
          credentials stay in Auth0 Token Vault and only short-lived tokens are
          released at execution time.
        </p>

        <div className="mb-12">
          <ConnectedAccounts
            initialAccounts={accounts}
            returnTo="/onboarding/connect"
            allowDisconnect={false}
          />
        </div>

        <Link href="/onboarding/setup" className="block text-center">
          <Button variant="primary" className="w-full">
            Continue to setup
          </Button>
        </Link>
        <p className="text-[12px] text-vigil-textTer mt-4 text-center">
          You can connect more services later from the dashboard.
        </p>
      </div>
    </main>
  );
}
