import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Invoice } from "@/types";
import { apiFetch, generatePaymentLink as clientGeneratePaymentLink } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Header from "@/components/Header";
import Link from "next/link";
import { formatDateMMDDYYYY } from "@/utils/formatters";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ invoices?: Invoice[] }>('invoices');
        const found = (res.data?.invoices || []).find((i: Invoice) => i.id === id || i.invoiceNumber === id);
        if (!found) {
          setError("Invoice not found");
          setInvoice(null);
        } else setInvoice(found);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handleGenerate = async () => {
    if (!invoice) return;
    const res = await clientGeneratePaymentLink(invoice.id);
    if (res.error) {
      return alert(res.error);
    }
    const url = res.data?.url ?? null;
    if (url) {
      // show the public customer-facing payment URL so the manager can copy/share it
      setPaymentUrl(url);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!invoice) return <div>No invoice found.</div>;

  return (
    <RequireAuth>
      <div>
        <Header />
        <div className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <Link href="/finance/invoices" className="text-sm underline text-blue-600">&larr; Back to Create</Link>
            <Link href="/finance/dashboard" className="text-sm underline text-gray-600">Dashboard</Link>
          </div>

          <h1>Invoice {invoice.invoiceNumber ?? invoice.id}</h1>
        <p>Customer: {invoice.customerName ?? invoice.customer?.name}</p>
        <p>Amount: ${invoice.amount}</p>
        <p>Due: {formatDateMMDDYYYY(invoice.dueDate)}</p>
        <p>Status: {invoice.status}</p>

        <div className="mt-4">
          <div className="flex items-center gap-3">
            <button onClick={handleGenerate} className="px-3 py-2 bg-blue-600 text-white rounded">
              Generate Payment Link
            </button>
            {paymentUrl && (
              <div className="flex items-center gap-2">
                <input readOnly value={paymentUrl} className="border p-2 rounded w-96" />
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(paymentUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="px-2 py-1 bg-emerald-500 rounded"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                  Open
                </a>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </RequireAuth>
  );
}
