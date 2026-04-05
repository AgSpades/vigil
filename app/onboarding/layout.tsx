import { Navbar } from "@/components/Navbar";
import { auth0 } from "@/lib/auth0";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();
  return (
    <>
      <Navbar authenticated={!!session} email={session?.user?.email} />
      <div className="pt-[72px] min-h-screen">
        {children}
      </div>
    </>
  );
}
