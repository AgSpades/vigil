import { Auth0Client } from "@auth0/nextjs-auth0/server";
import dns from "node:dns";

// Force Node.js to prefer IPv4 over IPv6 when resolving hostnames.
// This fixes ENOTFOUND errors on some networks when calling Auth0's discovery endpoint.
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const appBaseUrl = (process.env.APP_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

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
