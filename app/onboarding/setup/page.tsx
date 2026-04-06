import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { SetupChat } from "@/components/SetupChat";
import { getConnectedServices } from "@/lib/db/users";

export default async function SetupPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const connectedServices = await getConnectedServices(session.user.sub);

  return <SetupChat connectedServices={connectedServices} />;
}
