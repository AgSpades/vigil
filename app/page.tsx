import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { LandingContent } from "@/components/LandingContent";
import { getConnectedServices, hasCompletedOnboarding } from "@/lib/db/users";

export default async function Home() {
  const session = await auth0.getSession();

  if (session) {
    const [isOnboardingComplete, connectedServices] = await Promise.all([
      hasCompletedOnboarding(session.user.sub),
      getConnectedServices(session.user.sub),
    ]);

    if (isOnboardingComplete || connectedServices.length > 0) {
      redirect("/dashboard");
    }

    redirect("/onboarding/connect");
  }

  return (
    <main className="min-h-screen bg-vigil-bgPri relative overflow-hidden text-vigil-textPri">
      <Navbar authenticated={false} />
      <LandingContent authenticated={false} />
    </main>
  );
}
