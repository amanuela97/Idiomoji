import { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

type ResponseData = {
  message?: string;
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
    res.setHeader(
      "Set-Cookie",
      serialize("__session", "", {
        maxAge: -1,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
    );

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({ error: "Failed to logout" });
  }
}
