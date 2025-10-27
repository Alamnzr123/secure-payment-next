import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InvoiceCard from "@/components/InvoiceCard";
import { Invoice } from "@/types";
import RequireAuth from "@/components/RequireAuth";
import { apiFetch } from "@/lib/api";

const Dashboard = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);

  const response = await apiFetch<{ invoices?: Invoice[] }>(`invoices?${params.toString()}`);
  if (response.error) throw new Error(response.error);
  if (!cancelled) setInvoices(response.data?.invoices ?? []);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const t = setTimeout(fetchInvoices, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, statusFilter]);

  const isFetching = loading && invoices.length > 0;

  return (
    <RequireAuth>
      <div>
        <Header />
        <main className="p-4">
          <h1 className="text-2xl font-bold mb-4">Finance Manager Dashboard</h1>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center">
            <input
              className="border p-2 rounded w-64"
              placeholder="Search by invoice number or customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="border p-2 rounded"
              value={statusFilter ?? ""}
              onChange={(e) => setStatusFilter(e.target.value || undefined)}
            >
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            {isFetching && (
              <svg className="animate-spin h-5 w-5 text-gray-600 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
          </div>

          {loading && invoices.length === 0 ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {invoices.map((invoice) => {
                const amount = Number(invoice.amount ?? "0");
                const due = invoice.dueDate ?? invoice.invoiceDate ?? "";
                const customerName = invoice.customerName ?? invoice.customer?.name ?? "—";
                const invoiceId = invoice.invoiceNumber ?? invoice.id;
                const mapStatus = (s?: string | null) => {
                  if (!s) return "Pending" as const;
                  const lower = s.toLowerCase();
                  if (lower === "paid") return "Paid" as const;
                  if (lower === "overdue") return "Overdue" as const;
                  return "Pending" as const;
                };

                return (
                  <InvoiceCard
                    key={invoice.id}
                    invoiceId={invoiceId}
                    customerName={customerName}
                    dueDate={due}
                    amountDue={amount}
                    paymentStatus={mapStatus(invoice.status)}
                    onViewDetails={() => router.push(`/finance/invoices/${invoice.id}`)}
                  />
                );
              })}
            </div>
          )}

        </main>
        <Footer />
      </div>
    </RequireAuth>
  );
};

export default Dashboard;