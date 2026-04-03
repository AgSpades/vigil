import { Auth0AI, getAccessTokenFromTokenVault } from "@auth0/ai-vercel";

export const auth0AI = new Auth0AI();

// Re-export for use inside tool execute functions (must be called within a withTokenVault context)
export { getAccessTokenFromTokenVault };

// Google token scopes
export const GOOGLE_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
];
export const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
];
export const GITHUB_SCOPES = ["repo"];
