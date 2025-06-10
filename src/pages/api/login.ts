import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/app/lib/firebase-admin";
import { serialize } from "cookie";

type ResponseData = {
  status?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { idToken } = req.body;

    // Verify the ID token and create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    res.setHeader(
      "Set-Cookie",
      serialize("__session", sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
      })
    );

    return res.json({ status: "success" });
  } catch (error) {
    console.error("Error creating session:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
