import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { WhereInvoice } from "@/types";
import { Prisma } from "@prisma/client";

function normalizeInvoice(inv: Prisma.InvoiceGetPayload<{ include: { customer: true; paymentLink: true } }>) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerId: inv.customerId,
    customerName: inv.customer?.name ?? null,
    customer: inv.customer
      ? {
          id: inv.customer.id,
          name: inv.customer.name,
          email: inv.customer.email,
          phone: inv.customer.phone,
          createdAt: inv.customer.createdAt?.toString(),
        }
      : null,
    invoiceDate: inv.invoiceDate?.toString(),
    dueDate: inv.dueDate?.toString(),
    amount: inv.amount?.toString?.() ?? String(inv.amount),
    status: inv.status,
    paymentLink: inv.paymentLink ?? null,
    createdAt: inv.createdAt?.toString(),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { search, status, page = "1", limit = "50" } = req.query as Record<string, string>;
      const where: WhereInvoice = {};

      if (status) where.status = status;
      if (search) {
        where.OR = [
          { invoiceNumber: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      const pageNum = Math.max(1, Number(page) || 1);
      const pageSize = Math.max(1, Math.min(100, Number(limit) || 50));

      const invoices = await prisma.invoice.findMany({
        where,
        include: { customer: true, paymentLink: true },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      });

      return res.status(200).json({ invoices: invoices.map(normalizeInvoice) });
    }

    if (req.method === "POST") {
      const {
        invoiceNumber,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        invoiceDate,
        dueDate,
        amount,
        status = "pending",
      } = req.body ?? {};

      // validation
      if (!invoiceNumber) return res.status(400).json({ message: "invoiceNumber is required" });
      if (!customerId && !customerName) {
        return res.status(400).json({ message: "Customer information is required (customerId or customerName)" });
      }
      if (!invoiceDate || !dueDate || amount == null) {
        return res.status(400).json({ message: "invoiceDate, dueDate and amount are required" });
      }

      // ensure unique invoiceNumber
      const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } });
      if (existing) return res.status(409).json({ message: "Invoice number already exists" });

      // create or connect customer
      let customerConnect: Prisma.CustomerCreateNestedOneWithoutInvoicesInput = {};
      if (customerId) {
        const cust = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!cust) return res.status(404).json({ message: "Customer not found" });
        customerConnect = { connect: { id: customerId } };
      } else {
        customerConnect = {
          create: {
            name: customerName,
            email: customerEmail ?? null,
            phone: customerPhone ?? null,
          },
        };
      }

      const created = await prisma.invoice.create({
        data: {
          invoiceNumber,
          customer: customerConnect,
          invoiceDate: new Date(invoiceDate),
          dueDate: new Date(dueDate),
          amount: typeof amount === "string" ? amount : String(amount),
          status,
        },
        include: { customer: true, paymentLink: true },
      });

      return res.status(201).json({ invoice: normalizeInvoice(created) });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: unknown) {
    console.error("API /api/invoices error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return res.status(500).json({ message });
  }
}