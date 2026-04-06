import { Auth0AI, getAccessTokenFromTokenVault } from "@auth0/ai-vercel";
import { auth0 } from "@/lib/auth0";

/**
 * Initialize Auth0 AI for Token Vault support.
 */
export const auth0AI = new Auth0AI();

export { getAccessTokenFromTokenVault };

export const GOOGLE_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
];
export const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
];
export const GITHUB_SCOPES = ["repo"];

/**
 * Helper to wrap tools with Google (Gmail) Token Vault access.
 */
export const withGmail = auth0AI.withTokenVault({
  connection: "google-oauth2",
  scopes: GOOGLE_GMAIL_SCOPES,
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
  scopes: GITHUB_SCOPES,
  refreshToken: async () => {
    const session = await auth0.getSession();
    return session?.tokenSet?.refreshToken as string;
  },
});
