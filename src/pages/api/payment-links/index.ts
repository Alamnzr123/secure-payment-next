import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || "http://localhost:3000";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { invoiceId, expiresHours = 72 } = req.body ?? {};
  if (!invoiceId) return res.status(400).json({ message: "invoiceId is required" });

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });

  const token = crypto.randomBytes(20).toString("hex");
  const expiresAt = new Date(Date.now() + Number(expiresHours) * 3600 * 1000);

  // Use upsert so if a PaymentLink already exists for this invoice (invoiceId is unique)
  // refresh it (new token + expiresAt) instead of failing with a unique constraint error.
  const link = await prisma.paymentLink.upsert({
    where: { invoiceId },
    create: { token, invoiceId, expiresAt },
    update: { token, expiresAt, used: false },
  });

  const url = `${BASE_URL}/invoices/${link.token}`;
  return res.status(201).json({ token: link.token, url, expiresAt: link.expiresAt });
}
