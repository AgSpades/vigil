import { auth0 } from "@/lib/auth0";
import {
  getConnectedServices,
  upsertUser,
  ensureVigilConfig,
} from "@/lib/db/users";
import { createSetupChatHandler } from "@/lib/agent/setup-chat";
import { convertToModelMessages } from "ai";
import type { UIMessage } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.sub;
  const email = session.user.email ?? "";

  await upsertUser(userId, email);
  await ensureVigilConfig(userId);

  // DefaultChatTransport sends { messages: UIMessage[] }
  const { messages } = (await req.json()) as { messages: UIMessage[] };
  const modelMessages = await convertToModelMessages(messages);

  const connectedServices = await getConnectedServices(userId);
  const handler = createSetupChatHandler(userId, connectedServices);
  const result = await handler(modelMessages);

  return result.toUIMessageStreamResponse();
}
