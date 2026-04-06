"use client";

type Service = {
  id: string;
  name: string;
  description: string;
  connectionName: string;
};

const SERVICES: Service[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Send farewell emails to your contacts",
    connectionName: "google-oauth2",
  },
  {
    id: "drive",
    name: "Google Drive",
    description: "Archive and share your files",
    connectionName: "google-oauth2",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Transfer repository ownership",
    connectionName: "github",
  },
];

export function ConnectedAccounts({
  connected = [],
}: {
  connected: string[];
}) {
  function handleConnect(connectionName: string) {
    // Redirect to Auth0 connection flow
    window.location.assign(`/auth/login?connection=${connectionName}&returnTo=/dashboard/connect`);
  }

  return (
    <div className="grid gap-4">
      {SERVICES.map((svc) => {
        const isConnected = connected.includes(svc.id);
        return (
          <div
            key={svc.id}
            className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900"
          >
            <div>
              <p className="font-semibold text-zinc-100">{svc.name}</p>
              <p className="text-sm text-zinc-400">{svc.description}</p>
            </div>
            {isConnected ? (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800">
                Connected
              </span>
            ) : (
              <button
                onClick={() => handleConnect(svc.connectionName)}
                className="text-xs font-medium px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
              >
                Connect
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
