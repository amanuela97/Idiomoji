import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*", "/login", "/daily", "/stats", "/time-attack"],
};

export async function middleware(request: NextRequest) {
  try {
    const session = request.cookies.get("__session");
    const { pathname, origin } = request.nextUrl;
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");

    // Handle /login route - redirect to /time-attack if logged in
    if (pathname === "/login") {
      if (session) {
        // If there's a stored redirect path, use it
        if (redirectTo && redirectTo.startsWith("/")) {
          return NextResponse.redirect(`${origin}${redirectTo}`);
        }
        return NextResponse.redirect(`${origin}/time-attack`);
      }
      return NextResponse.next();
    }

    // Handle /time-attack route - ensure user is authenticated
    if (pathname === "/time-attack") {
      if (!session) {
        return NextResponse.redirect(`${origin}/login?redirectTo=/time-attack`);
      }
      return NextResponse.next();
    }

    // Handle /stats route - ensure user is authenticated
    if (pathname === "/stats") {
      if (!session) {
        return NextResponse.redirect(`${origin}/login?redirectTo=/stats`);
      }
      return NextResponse.next();
    }

    // Handle /daily route - allow access to all
    if (pathname === "/daily") {
      return NextResponse.next();
    }

    // Handle /admin routes - verify admin status
    if (pathname.startsWith("/admin")) {
      if (!session) {
        return NextResponse.redirect(`${origin}/login?redirectTo=${pathname}`);
      }

      // Verify the session
      try {
        const verifyUrl = new URL("/api/verify", origin);
        const verifyResponse = await fetch(verifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `__session=${session.value}`,
          },
        });

        if (!verifyResponse.ok) {
          return NextResponse.redirect(`${origin}/`);
        }

        const data = await verifyResponse.json();

        if (!data.isValid) {
          return NextResponse.redirect(`${origin}/login`);
        }

        if (!data.isAdmin) {
          return NextResponse.redirect(`${origin}/`);
        }

        return NextResponse.next();
      } catch (error) {
        console.error("Middleware error:", error);
        return NextResponse.redirect(`${origin}/`);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}
