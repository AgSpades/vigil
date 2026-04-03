import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { SetupChat } from "@/components/SetupChat";
import Link from "next/link";

export default async function SetupPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0">
        <Link
          href="/dashboard"
          className="font-bold text-zinc-100 tracking-tight"
        >
          Vigil
        </Link>
        <span className="text-sm text-zinc-500">Configure your wishes</span>
      </nav>

      {/* Chat fills remaining height */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full overflow-hidden">
        <SetupChat />
      </div>
    </div>
  );
}
