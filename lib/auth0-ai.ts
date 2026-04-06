import { Auth0AI } from "@auth0/ai-vercel";
import { auth0 } from "@/lib/auth0";

/**
 * Initialize Auth0 AI for Token Vault support.
 */
const auth0AI = new Auth0AI();

/**
 * Helper to wrap tools with Google (Gmail) Token Vault access.
 */
export const withGmail = auth0AI.withTokenVault({
  connection: "google-oauth2",
  scopes: ["https://www.googleapis.com/auth/gmail.send"],
  refreshToken: async () => {
    const session = await auth0.getSession();
    return session?.tokenSet?.refreshToken as string;
  },
});

/**
 * Helper to wrap tools with GitHub Token Vault access.
 */
export const withGitHub = auth0AI.withTokenVault({
  connection: "github",
  scopes: ["repo"],
  refreshToken: async () => {
    const session = await auth0.getSession();
    return session?.tokenSet?.refreshToken as string;
  },
});
