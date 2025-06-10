import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session");

    if (!sessionCookie) {
      console.log("No session cookie found");
      return NextResponse.json(
        {
          isValid: false,
          isAdmin: false,
          error: "No session cookie found",
        },
        { status: 401 }
      );
    }

    // Verify the session cookie and get claims
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie.value,
      true
    );

    if (!decodedClaims) {
      console.log("Invalid session cookie");
      return NextResponse.json(
        {
          isValid: false,
          isAdmin: false,
          error: "Invalid session cookie",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      isValid: true,
      isAdmin: decodedClaims.admin === true,
    });
  } catch (error) {
    console.error("Error verifying session:", error);
    return NextResponse.json(
      {
        isValid: false,
        isAdmin: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 401 }
    );
  }
}

// Also support GET for convenience
export { POST as GET };
