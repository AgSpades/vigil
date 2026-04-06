import { ConnectedAccounts } from "@/components/ConnectedAccounts";
import { auth0 } from "@/lib/auth0";
import { CONNECTED_SERVICES } from "@/lib/auth0-connected-accounts";
import { fetchConnectedAccounts } from "@/lib/auth0-my-account";

export default async function DashboardConnectPage() {
    const session = await auth0.getSession();
    if (!session) {
        return null;
    }

    const probeConnections = Array.from(
        new Set(CONNECTED_SERVICES.map((service) => service.connectionName)),
    );
    const accounts = await fetchConnectedAccounts({ probeConnections });

    return (
        <main className="min-h-[calc(100vh-72px)] bg-vigil-bgPri p-6 md:p-12 text-vigil-textPri flex justify-center fade-up relative pb-[120px]">
            <div className="w-full max-w-[900px] flex flex-col gap-8">
                <section className="flex flex-col gap-3">
                    <h1 className="font-serif text-[40px] md:text-[56px] font-light leading-[1.1]">
                        Manage Connections
                    </h1>
                    <p className="text-vigil-textSec text-[14px]">
                        Add or remove connected services. Disconnecting a service automatically
                        cancels pending tasks that depend on it.
                    </p>
                </section>

                <ConnectedAccounts initialAccounts={accounts} returnTo="/dashboard/connect" />
            </div>
        </main>
    );
}
