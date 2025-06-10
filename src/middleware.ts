import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*", "/login", "/daily", "/stats"],
  runtime: "experimental-edge",
};

export async function middleware(request: NextRequest) {
  try {
    const session = request.cookies.get("__session");

    // Handle /login route - redirect to /daily if logged in
    if (request.nextUrl.pathname === "/login") {
      if (session) {
        // If there's a stored redirect path, use it
        const searchParams = new URL(request.url).searchParams;
        const redirectTo = searchParams.get("redirectTo");
        if (redirectTo && redirectTo.startsWith("/")) {
          return NextResponse.redirect(new URL(redirectTo, request.url));
        }
        return NextResponse.redirect(new URL("/daily", request.url));
      }
      return NextResponse.next();
    }

    // Handle /stats route - ensure user is authenticated
    if (request.nextUrl.pathname === "/stats") {
      if (!session) {
        const url = new URL("/login", request.url);
        url.searchParams.set("redirectTo", "/stats");
        return NextResponse.redirect(url);
      }
      // Pass through the session cookie
      const response = NextResponse.next();
      response.cookies.set("__session", session.value);
      return response;
    }

    // Handle /daily route - allow access to all
    if (request.nextUrl.pathname === "/daily") {
      return NextResponse.next();
    }

    // Handle /admin routes - verify admin status
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (!session) {
        const url = new URL("/login", request.url);
        url.searchParams.set("redirectTo", request.nextUrl.pathname);
        return NextResponse.redirect(url);
      }

      // Verify the session
      try {
        // Create a new URL object from the current request URL
        const verifyUrl = new URL("/api/verify", request.url);

        const verifyResponse = await fetch(verifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `__session=${session.value}`,
          },
        });

        if (!verifyResponse.ok) {
          return NextResponse.redirect(new URL("/", request.url));
        }

        const data = await verifyResponse.json();

        if (!data.isValid) {
          return NextResponse.redirect(new URL("/login", request.url));
        }

        if (!data.isAdmin) {
          return NextResponse.redirect(new URL("/", request.url));
        }

        // Pass through the session cookie
        const response = NextResponse.next();
        response.cookies.set("__session", session.value);
        return response;
      } catch (error) {
        console.error("Middleware error:", error);
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}
