import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { LandingContent } from "@/components/LandingContent";
import { hasCompletedOnboarding } from "@/lib/db/users";

export default async function Home() {
  const session = await auth0.getSession();

  if (session) {
    const isOnboardingComplete = await hasCompletedOnboarding(session.user.sub);
    redirect(isOnboardingComplete ? "/dashboard" : "/onboarding/connect");
  }

  return (
    <main className="min-h-screen bg-vigil-bgPri relative overflow-hidden text-vigil-textPri">
      <Navbar authenticated={false} />
      <LandingContent authenticated={false} />
    </main>
  );
}
