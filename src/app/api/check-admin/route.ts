// pages/api/check-admin.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const uid = data.uid?.trim();

    if (!uid) {
      return NextResponse.json({ error: "Missing UID" }, { status: 400 });
    }

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
    console.error(error);
    return NextResponse.json({ error: "Failed to set claim" }, { status: 500 });
  }
}
