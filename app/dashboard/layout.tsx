import { Navbar } from "@/components/Navbar";
import { auth0 } from "@/lib/auth0";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();
  return (
    <>
      <Navbar authenticated={true} email={session?.user?.email || "user@example.com"} />
      <div className="pt-[72px] min-h-screen">
        {children}
      </div>
    </>
  );
}
