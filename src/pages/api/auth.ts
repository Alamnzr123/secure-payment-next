import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_in_prod";
const TOKEN_NAME = "token";

type Data = { message?: string; user?: { id: string; email: string; role?: string } };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method === "POST") return handleLogin(req, res);
  if (req.method === "GET") return handleValidate(req, res);

  res.setHeader("Allow", ["POST", "GET"]);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}

async function handleLogin(req: NextApiRequest, res: NextApiResponse<Data>) {
  const { email, password } = req.body ?? {};

  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  // create token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  // set httpOnly cookie
  const serialized = cookie.serialize(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  res.setHeader("Set-Cookie", serialized);

  return res.status(200).json({ message: "Login successful", user: { id: user.id, email: user.email, role: user.role } });
}

async function handleValidate(req: NextApiRequest, res: NextApiResponse<Data>) {
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const token = cookies[TOKEN_NAME];

  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; iat?: number; exp?: number };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ message: "Invalid token" });

    return res.status(200).json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}