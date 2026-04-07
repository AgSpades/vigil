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

type VaultWrappedTool = object;

/**
 * Helper factory to wrap tools with Google (Gmail) Token Vault access.
 * Keep this lazy to avoid requiring Auth0 env vars during build-time module evaluation.
 */
export function withGmail<T extends VaultWrappedTool>(tool: T): T {
  return auth0AI.withTokenVault(
    {
      connection: "google-oauth2",
      scopes: GOOGLE_GMAIL_SCOPES,
      refreshToken: async () => {
        const session = await auth0.getSession();
        return session?.tokenSet?.refreshToken as string;
      },
    },
    tool,
  );
}

/**
 * Helper factory to wrap tools with GitHub Token Vault access.
 * Keep this lazy to avoid requiring Auth0 env vars during build-time module evaluation.
 */
export function withGitHub<T extends VaultWrappedTool>(tool: T): T {
  return auth0AI.withTokenVault(
    {
      connection: "github",
      scopes: GITHUB_SCOPES,
      refreshToken: async () => {
        const session = await auth0.getSession();
        return session?.tokenSet?.refreshToken as string;
      },
    },
    tool,
  );
}
