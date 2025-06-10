// pages/api/check-admin.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";

export const runtime = "nodejs";

// Explicitly type the request body
interface AdminCheckRequest {
  uid: string;
}

export async function POST(request: NextRequest) {
  try {
    let data: AdminCheckRequest;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const uid = data.uid?.trim();

    if (!uid) {
      return NextResponse.json({ error: "Missing UID" }, { status: 400 });
    }

    console.log("Processing request for UID:", uid);
    console.log("ADMIN_LIST value:", process.env.ADMIN_LIST);

    // Ensure ADMIN_LIST is properly typed and handled
    const adminList = process.env.ADMIN_LIST ?? "";
    const adminUids = adminList
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    console.log("Processed ADMIN_LIST:", adminUids);

    if (!adminUids.includes(uid)) {
      return NextResponse.json(
        { message: "Not an admin UID" },
        { status: 403 }
      );
    }

    const user = await adminAuth.getUser(uid);

    // Only set if not already an admin
    if (!user.customClaims?.admin) {
      await adminAuth.setCustomUserClaims(uid, { admin: true });
      return NextResponse.json({ message: "Admin claim set" }, { status: 200 });
    } else {
      return NextResponse.json(
        { message: "User already has admin claim" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("General Error:", error);
    return NextResponse.json(
      {
        error: "Failed to set claim",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
