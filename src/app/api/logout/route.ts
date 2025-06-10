import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Logged out successfully" });

    // Clear the session cookie
    response.cookies.delete("__session");

    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
