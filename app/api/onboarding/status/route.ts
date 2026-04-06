import { auth0 } from "@/lib/auth0";
import { hasCompletedOnboarding } from "@/lib/db/users";

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const completed = await hasCompletedOnboarding(session.user.sub);
  return Response.json({ completed });
}
