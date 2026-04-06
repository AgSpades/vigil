import { auth0 } from "@/lib/auth0";
import { Navbar } from "@/components/Navbar";
import { LandingContent } from "@/components/LandingContent";

export default async function Home() {
  const session = await auth0.getSession();
  const authenticated = !!session;

  return (
    <main className="min-h-screen bg-vigil-bgPri relative overflow-hidden text-vigil-textPri">
      <Navbar authenticated={authenticated} email={session?.user?.email} />      <LandingContent authenticated={authenticated} />
    </main>
  );
}
