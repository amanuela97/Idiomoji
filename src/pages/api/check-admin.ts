import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/app/lib/firebase-admin";

// Explicitly type the response data
type ResponseData = {
  message?: string;
  error?: string;
  details?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { uid } = req.body;

    if (!uid?.trim()) {
      return res.status(400).json({ error: "Missing UID" });
    }

    const trimmedUid = uid.trim();
    const adminList = process.env.ADMIN_LIST ?? "";
    const adminUids = adminList
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!adminUids.includes(trimmedUid)) {
      return res.status(403).json({ message: "Not an admin UID" });
    }

    const user = await adminAuth.getUser(trimmedUid);

    if (!user.customClaims?.admin) {
      await adminAuth.setCustomUserClaims(trimmedUid, { admin: true });
      return res.status(200).json({ message: "Admin claim set" });
    }

    return res.status(200).json({ message: "User already has admin claim" });
  } catch (error) {
    console.error("Error in check-admin:", error);
    return res.status(500).json({
      error: "Failed to set claim",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
