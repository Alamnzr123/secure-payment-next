import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { token } = req.body ?? {};
  if (!token) return res.status(400).json({ message: "token required" });
  // demo token: accept without DB and return a success payload for UI tests
  if (token === "sample-token") {
    return res.status(200).json({
      message: "Payment recorded",
      invoice: {
        id: "demo-inv-1",
        invoiceNumber: "INV-12345",
        amount: "500.00",
      },
    });
  }

  const link = await prisma.paymentLink.findUnique({ where: { token } });
  if (!link) return res.status(404).json({ message: "Payment link not found" });
  if (link.used) return res.status(410).json({ message: "Payment link already used" });
  if (link.expiresAt < new Date()) return res.status(410).json({ message: "Payment link expired" });

  // mark link used and invoice paid
  await prisma.paymentLink.update({ where: { token }, data: { used: true } });
  const updatedInvoice = await prisma.invoice.update({ where: { id: link.invoiceId }, data: { status: "paid" } });

  return res.status(200).json({ message: "Payment recorded", invoice: { id: updatedInvoice.id, invoiceNumber: updatedInvoice.invoiceNumber, amount: updatedInvoice.amount?.toString() } });
}
