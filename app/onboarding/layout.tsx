import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { auth0 } from "@/lib/auth0";
import { hasCompletedOnboarding } from "@/lib/db/users";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const isOnboardingComplete = await hasCompletedOnboarding(session.user.sub);
  if (isOnboardingComplete) {
    redirect("/dashboard");
  }

  return (
    <>
      <Navbar authenticated={true} email={session.user.email} />
      <div className="pt-[72px] min-h-screen">
        {children}
      </div>
    </>
  );
}
