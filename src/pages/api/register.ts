import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type Data = { message?: string; user?: Record<string, unknown>; fieldErrors?: Record<string, string> };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { email, password, role = "FINANCE_MANAGER" } = req.body ?? {};

    // basic validation
    const fieldErrors: Record<string, string> = {};
    if (!email) fieldErrors.email = "Email is required";
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) fieldErrors.email = "Invalid email format";
    }

    if (!password) fieldErrors.password = "Password is required";
    else if (typeof password === "string" && password.length < 8) fieldErrors.password = "Password must be at least 8 characters";

    if (Object.keys(fieldErrors).length > 0) return res.status(400).json({ message: "Validation failed", fieldErrors });

  const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, role } });

  // strip password when returning
  const safeObj = { ...(user as unknown as Record<string, unknown>) } as Record<string, unknown>;
  if (safeObj && typeof safeObj === "object") delete (safeObj as Record<string, unknown>)["password"];
  return res.status(201).json({ user: safeObj });
  } catch (err: unknown) {
    console.error("/api/register error", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return res.status(500).json({ message });
  }
}
