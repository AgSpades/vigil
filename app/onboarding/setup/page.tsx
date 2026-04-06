import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { SetupChat } from "@/components/SetupChat";
import { getConnectedServices, hasCompletedOnboarding } from "@/lib/db/users";

export default async function SetupPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const onboardingCompleted = await hasCompletedOnboarding(session.user.sub);
  if (onboardingCompleted) {
    redirect("/dashboard");
  }

  const connectedServices = await getConnectedServices(session.user.sub);

  return <SetupChat connectedServices={connectedServices} />;
}
