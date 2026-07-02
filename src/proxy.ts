// src/proxy.ts — Next.js 16 route protection
import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("cdc_session")?.value;
  const session = token ? await decrypt(token) : null;

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?redirect=/admin", req.url));
    }
  }

  // Dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login?redirect=/dashboard", req.url));
    }
    // VIEWER role: read-only, no upload
    if (session.role === "VIEWER") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Already logged in → redirect away from login page
  if (pathname === "/login" && session) {
    const dest = session.role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login"],
};
