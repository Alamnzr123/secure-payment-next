import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Invoice } from "@/types";
import { apiFetch, fetchInvoiceByToken } from "@/lib/api";
import { formatDateMMDDYYYY, formatCountdown as fmtCountdown } from '@/utils/formatters';

const InvoicePage = () => {
  const router = useRouter();
  const { token } = router.query;
  const tokenStr = Array.isArray(token) ? token[0] : token ?? '';
  const [isDark, setIsDark] = useState<boolean>(tokenStr === 'sample-token');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const formatCountdown = fmtCountdown;

  // payment UI state/hooks
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [confirmation, setConfirmation] = useState<{ invoiceNumber?: string; amount?: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    let timer: NodeJS.Timeout | null = null;

    const getInvoice = async () => {
      try {
        const res = await fetchInvoiceByToken(token as string);
        if (res.error) {
          setError(res.error);
          setInvoice(null);
        } else if (res.data && res.data.invoice) {
          const inv = res.data.invoice as Invoice;
          setInvoice(inv);
          // if the API returned link.expiresAt, set it and start countdown
          const expires = res.data.link?.expiresAt ?? null;
          if (expires) {
            const expiresIso = typeof expires === 'string' ? expires : new Date(expires).toISOString();
            setExpiresAt(expiresIso);
            // initialize remaining seconds
            const secs = Math.max(0, Math.floor((new Date(expiresIso).getTime() - Date.now()) / 1000));
            setRemainingSeconds(secs);
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
              const secsLeft = Math.max(0, Math.floor((new Date(expiresIso).getTime() - Date.now()) / 1000));
              setRemainingSeconds(secsLeft);
            }, 1000);
            // dark-themed payment page
            if (res.data.link) setIsDark(true);
          }
        } else {
          setError("Invoice not found");
          setInvoice(null);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch invoice. Please try again.");
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };

    getInvoice();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [token]);

  const handlePay = async () => {
    if (!token) return setPayError("Missing token");
    setPayError(null);
    setIsPaying(true);
    try {
  const res = await apiFetch<{ invoice?: Invoice }>('payment-links/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token as string }),
        });
        if (res.error) {
          setPayError(res.error);
        } else {
          setPaid(true);
          setInvoice((inv) => (inv ? { ...inv, status: 'paid' } : inv));
          // when paid, clear countdown
          setRemainingSeconds(0);
          setExpiresAt(null);
          // API returns invoice details when successful
    setConfirmation({ invoiceNumber: res.data?.invoice?.invoiceNumber ?? undefined, amount: res.data?.invoice?.amount ?? undefined });
        }
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!invoice) return <div className="p-4">No invoice found.</div>;

  // treat any status value of 'paid' (case-insensitive) as paid
  const isExpired = remainingSeconds !== null && remainingSeconds <= 0;
  const isInvoicePaid = paid || (invoice.status ? invoice.status.toLowerCase() === "paid" : false) || isExpired;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-black text-white' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-xl ${isDark ? 'bg-transparent' : 'bg-white'} shadow-md rounded-lg p-6`}> 
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h2 className="text-lg font-semibold">Invoice {invoice.invoiceNumber ?? invoice.id}</h2>
            <p className="text-sm text-gray-500">Invoice ID: {invoice.id}</p>
          </div>
          <div className="text-right">
              <div className="text-sm text-gray-600">Due</div>
              <div className="font-medium">{formatDateMMDDYYYY(invoice.dueDate ?? null)}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Customer</div>
            <div className="font-medium">{invoice.customerName ?? invoice.customer?.name ?? '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Amount Due</div>
            <div className="text-2xl font-bold">${typeof invoice.amount === 'string' ? Number(invoice.amount).toFixed(2) : String(invoice.amount ?? '—')}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className={`px-2 py-1 rounded-full text-sm ${isInvoicePaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {isInvoicePaid ? 'Paid' : invoice.status ?? 'Pending'}
            </span>
            {remainingSeconds !== null && remainingSeconds > 0 && (
              <div className="text-sm text-gray-500 mt-2">Expires in: {formatCountdown(remainingSeconds)}</div>
            )}
            {expiresAt && (
              <div className="text-sm text-gray-500 mt-1">Expires at: {new Date(expiresAt).toLocaleString()}</div>
            )}
            {remainingSeconds !== null && remainingSeconds <= 0 && (
              <div className="text-sm text-red-600 mt-2">This payment link has expired.</div>
            )}
          </div>

          <div>
            {payError && <div className="text-sm text-red-600 mb-2">{payError}</div>}

            {confirmation ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                <strong>Payment completed</strong>
                <div>
                  Payment of ${confirmation.amount ?? invoice.amount ?? '—'} for Invoice #{confirmation.invoiceNumber ?? invoice.invoiceNumber ?? invoice.id} completed successfully.
                </div>
              </div>
            ) : (
              <button
                onClick={handlePay}
                disabled={isPaying || isInvoicePaid}
                className={`px-4 py-2 rounded ${isInvoicePaid ? 'bg-gray-400 text-white' : (isDark ? 'bg-white text-black' : 'bg-blue-600 text-white hover:bg-blue-700')}`}
              >
                {isPaying ? 'Processing...' : isInvoicePaid ? 'Paid' : 'Pay Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;