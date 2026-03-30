import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, readSessionToken } from "@/lib/session-token";

function needsAuth(pathname: string): boolean {
  return (
    pathname.startsWith("/leads") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/lead-sources") ||
    pathname.startsWith("/ingest-tokens")
  );
}

export async function middleware(request: NextRequest) {
  if (!needsAuth(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await readSessionToken(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/leads/:path*",
    "/users/:path*",
    "/lead-sources",
    "/lead-sources/:path*",
    "/ingest-tokens",
    "/ingest-tokens/:path*",
  ],
};
