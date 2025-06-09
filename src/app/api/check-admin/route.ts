// pages/api/check-admin.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    // Safely parse JSON and handle potential control characters
    let uid: string;
    try {
      const text = await request.text();
      // Remove any control characters before parsing
      const sanitizedText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
      const data = JSON.parse(sanitizedText);
      uid = data.uid;
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    if (!uid) {
      return NextResponse.json({ error: "Missing UID" }, { status: 400 });
    }

    // Sanitize UID
    uid = uid.trim();

    const ADMIN_LIST =
      process.env.ADMIN_LIST?.split(",").map((id) => id.trim()) || [];

    if (!ADMIN_LIST.includes(uid)) {
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
    console.error("Server error:", error);
    return NextResponse.json({ error: "Failed to set claim" }, { status: 500 });
  }
}
