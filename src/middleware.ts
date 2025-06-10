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

      // Verify the session
      try {
        const verifyResponse = await fetch(
          new URL("/api/verify", request.url),
          {
            headers: {
              Cookie: `__session=${session.value}`,
            },
          }
        );

        const { isValid } = await verifyResponse.json();

        if (!isValid) {
          // If session is invalid, redirect to login
          const url = new URL("/login", request.url);
          url.searchParams.set("redirectTo", "/stats");
          const response = NextResponse.redirect(url);
          response.cookies.delete("__session");
          return response;
        }

        return NextResponse.next();
      } catch (error) {
        console.error("Failed to verify session for /stats:", error);
        const url = new URL("/login", request.url);
        url.searchParams.set("redirectTo", "/stats");
        const response = NextResponse.redirect(url);
        response.cookies.delete("__session");
        return response;
      }
    }

    // Handle /daily route - ensure proper auth state
    if (request.nextUrl.pathname === "/daily") {
      if (!session) {
        // Allow access without session (for non-logged in users)
        return NextResponse.next();
      }

      // If there is a session, verify it's valid
      try {
        const verifyResponse = await fetch(
          new URL("/api/verify", request.url),
          {
            headers: {
              Cookie: `__session=${session.value}`,
            },
          }
        );

        const { isValid } = await verifyResponse.json();

        if (!isValid) {
          // If session is invalid, clear it and allow access as non-logged in user
          const response = NextResponse.next();
          response.cookies.delete("__session");
          return response;
        }

        return NextResponse.next();
      } catch (error) {
        // If verification fails, clear session and allow access as non-logged in user
        console.error("Failed to verify session for /daily:", error);
        const response = NextResponse.next();
        response.cookies.delete("__session");
        return response;
      }
    }

    // Handle /admin routes
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (!session) {
        const url = new URL("/login", request.url);
        url.searchParams.set("redirectTo", request.nextUrl.pathname);
        return NextResponse.redirect(url);
      }

      // Verify the session by calling our API route
      const verifyResponse = await fetch(new URL("/api/verify", request.url), {
        headers: {
          Cookie: `__session=${session.value}`,
        },
      });

      const { isValid, isAdmin } = await verifyResponse.json();

      if (!isValid || !isAdmin) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // If there's an error verifying the session or the user is not an admin,
    // redirect to login
    const url = new URL("/login", request.url);
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
}
