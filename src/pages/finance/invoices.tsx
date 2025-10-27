import { useRouter } from "next/router";
import InvoiceForm from "@/components/InvoiceForm";
import { Invoice } from "@/types";
import RequireAuth from "@/components/RequireAuth";
import Header from "@/components/Header";

const InvoicesPage = () => {
  const router = useRouter();

  const handleInvoiceCreated = (newInvoice: Invoice) => {
    // redirect to created invoice detail or dashboard
    if (newInvoice?.id) router.push(`/finance/invoices/${newInvoice.id}`);
    else router.push('/finance/dashboard');
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-black/60 border border-gray-800 shadow-md rounded-lg p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold">Create Invoice</h1>
                <p className="text-sm text-gray-300 mt-1">Create a new invoice to send to your customer. Fill out the required fields and click Create.</p>
              </div>

              <div>
                <InvoiceForm
                  onSubmit={(data) => {
                    if (data && typeof data === "object" && "id" in data) {
                      handleInvoiceCreated(data as Invoice);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
};

export default InvoicesPage;