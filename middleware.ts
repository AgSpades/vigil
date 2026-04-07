import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // If user declines authorization, restart from a clean login route.
  if (
    pathname === "/auth/callback" &&
    searchParams.get("error") === "access_denied"
  ) {
    const restartUrl = new URL("/auth/login", request.url);
    restartUrl.searchParams.set("prompt", "login");
    restartUrl.searchParams.set("authorization_error", "access_denied");
    return NextResponse.redirect(restartUrl);
  }

  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
