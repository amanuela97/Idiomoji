import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();
    const sessionCookie = request.cookies.get("__session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "No session cookie found" },
        { status: 401 }
      );
    }

    // Verify the session cookie first
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie.value,
      true
    );
    if (!decodedClaims) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!uid?.trim()) {
      return NextResponse.json({ error: "Missing UID" }, { status: 400 });
    }

    const trimmedUid = uid.trim();
    const adminList = process.env.ADMIN_LIST ?? "";
    const adminUids = adminList
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!adminUids.includes(trimmedUid)) {
      return NextResponse.json(
        { message: "Not an admin UID" },
        { status: 403 }
      );
    }

    const user = await adminAuth.getUser(trimmedUid);

    if (!user.customClaims?.admin) {
      await adminAuth.setCustomUserClaims(trimmedUid, { admin: true });
      return NextResponse.json({ message: "Admin claim set" }, { status: 200 });
    }

    return NextResponse.json(
      { message: "User already has admin claim" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in check-admin:", error);
    return NextResponse.json(
      {
        error: "Failed to set claim",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
