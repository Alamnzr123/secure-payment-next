import type { NextApiRequest, NextApiResponse } from "next";
import * as cookie from "cookie";

const TOKEN_NAME = "token";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  // Clear cookie
  const serialized = cookie.serialize(TOKEN_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.setHeader("Set-Cookie", serialized);
  return res.status(200).json({ message: "Logged out" });
}
