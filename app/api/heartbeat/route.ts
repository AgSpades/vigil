import { auth0 } from "@/lib/auth0";

export async function POST() {
  const session = await auth0.getSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json(
    {
      error: "Deprecated endpoint. Use /api/verify-checkin with PIN.",
    },
    { status: 410 },
  );
}
