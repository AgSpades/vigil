export async function GET() {
  return Response.json(
    {
      error: "Check-in PIN options are disabled.",
    },
    { status: 410 },
  );
}

export async function POST() {
  return Response.json(
    {
      error: "Check-in PIN options are disabled.",
    },
    { status: 410 },
  );
}
