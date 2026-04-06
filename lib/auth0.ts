import { Auth0Client } from "@auth0/nextjs-auth0/server";

const appBaseUrl = (
  process.env.APP_BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  secret: process.env.AUTH0_SECRET!,
  appBaseUrl,
  authorizationParameters: {
    scope: "openid profile email offline_access",
    // We include only the primary audience to ensure login works.
    audience: process.env.AUTH0_AUDIENCE,
  },
  session: {
    cookie: {
      name: "appSession",
      sameSite: "lax", // Required for redirects from Auth0 to localhost
      secure: process.env.NODE_ENV === "production",
    },
  },
  enableConnectAccountEndpoint: true,
});
