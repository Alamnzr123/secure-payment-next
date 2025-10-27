export type Customer = {
  id: string;
  name: string;
  email?: string | null;
    paymentLink?: string | null;
  phone?: string | null;
  createdAt?: string | null;
};

export type PaymentLink = {
  id: string;
  token: string;
  invoiceId: string;
  expiresAt: string;
  used: boolean;
  createdAt?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber?: string | null;
  customerId?: string | null;
  customer?: Customer | null;
  customerName?: string | null;
  invoiceDate?: string | null; // ISO
  dueDate?: string | null;
  amount?: string | null; // serialized Decimal
  status?: string | null;
  paymentLink?: string | null;
  createdAt?: string | null;
};

export type WhereInvoice = {
  status?: string;
  OR?: Array<{ invoiceNumber: { contains: string; mode: "insensitive" } } | { customer: { name: { contains: string; mode: "insensitive" } } }>;  
}

export type ApiResponse<T = object> = { data?: T; error?: string; message?: string };