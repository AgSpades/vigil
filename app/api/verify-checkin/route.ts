export async function POST() {
  return Response.json(
    {
      error: "PIN verification endpoint is disabled.",
    },
    { status: 410 },
  );
}
