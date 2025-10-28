// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value || "";

  // ✅ Define public (non-protected) routes
  const publicRoutes = ["/login", "/register", "/"];

  const isPublic = publicRoutes.some((path) => req.nextUrl.pathname.startsWith(path));

  // 🚫 If no token and route is protected → redirect to login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ✅ If logged in and tries to access login/register → redirect to dashboard
  if (token && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and APIs
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
