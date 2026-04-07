import { sql } from "./client";
import type { ContactContext } from "./types";

export async function saveContactContext(data: {
  userId: string;
  contactName: string;
  contactEmail?: string;
  relationship: string;
  context: string;
}): Promise<ContactContext> {
  const rows = await sql`
    INSERT INTO "ContactContext" ("userId", "contactName", "contactEmail", "relationship", "context")
    VALUES (${data.userId}, ${data.contactName}, ${data.contactEmail ?? null}, ${data.relationship}, ${data.context})
    RETURNING *
  `;
  return rows[0] as ContactContext;
}

export async function getContactContext(
  userId: string,
): Promise<ContactContext[]> {
  const rows = await sql`
    SELECT * FROM "ContactContext" WHERE "userId" = ${userId}
  `;
  return rows as ContactContext[];
}
