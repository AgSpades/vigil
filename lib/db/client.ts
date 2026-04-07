import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// `neon` returns a tagged-template SQL function.
// Import and use `sql` from this file everywhere in lib/db/.
export const sql = neon(process.env.DATABASE_URL);
