import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/app/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session");

    if (!sessionCookie?.value) {
      console.log("No session cookie value found");
      return NextResponse.json(
        { isValid: false, isAdmin: false },
        { status: 401 }
      );
    }

    // Verify the session cookie and get claims
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie.value,
      true
    );

    return NextResponse.json({
      isValid: true,
      isAdmin: decodedClaims.admin === true,
    });
  } catch (error) {
    console.error("Error verifying session:", error);
    return NextResponse.json(
      { isValid: false, isAdmin: false },
      { status: 401 }
    );
  }
}
