import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/app/lib/firebase-admin";

type ResponseData = {
  isValid: boolean;
  isAdmin: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ isValid: false, isAdmin: false, error: "Method not allowed" });
  }

  try {
    const sessionCookie = req.cookies.__session;

    if (!sessionCookie) {
      console.log("No session cookie value found");
      return res.status(401).json({ isValid: false, isAdmin: false });
    }

    // Verify the session cookie and get claims
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    return res.json({
      isValid: true,
      isAdmin: decodedClaims.admin === true,
    });
  } catch (error) {
    console.error("Error verifying session:", error);
    return res.status(401).json({ isValid: false, isAdmin: false });
  }
}
