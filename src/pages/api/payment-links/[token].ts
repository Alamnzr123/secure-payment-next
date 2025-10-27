import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query as { token?: string };
  if (!token) return res.status(400).json({ message: "Token required" });

  // special demo token: return a sample invoice without needing DB data
  if (token === "sample-token") {
    const demoInvoice = {
      id: "demo-inv-1",
      invoiceNumber: "INV-12345",
      customerName: "John Doe",
      customer: { id: "demo-cust-1", name: "John Doe", email: "contact@john.com" },
      invoiceDate: new Date("2023-09-25").toISOString(),
      dueDate: new Date("2023-10-10").toISOString(),
      amount: "500.00",
      status: "pending",
      paymentLink: `/invoices/${token}`,
    };
    return res.status(200).json({ link: { token, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) }, invoice: demoInvoice });
  }

  const link = await prisma.paymentLink.findUnique({
    where: { token },
    include: { invoice: { include: { customer: true } } },
  });

  if (!link) return res.status(404).json({ message: "Payment link not found" });
  if (link.used) return res.status(410).json({ message: "Payment link already used" });
  if (link.expiresAt < new Date()) return res.status(410).json({ message: "Payment link expired" });

  return res.status(200).json({ link, invoice: link.invoice });
}
