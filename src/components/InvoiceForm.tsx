import { useForm } from "react-hook-form";
import { Invoice } from "@/types";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type FormValues = {
  invoiceId?: string;
  customerName?: string;
  contactDetails?: string;
  invoiceDate?: string;
  dueDate?: string;
  amountDue?: string;
  paymentStatus?: string;
};

type Props = {
  // onSubmit will be called with the created invoice from the API
  onSubmit?: (data: FormValues | Invoice) => void;
  initialData?: FormValues;
};

export default function InvoiceForm({ onSubmit, initialData }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const [invoiceDateVal, setInvoiceDateVal] = useState<Date | null>(initialData?.invoiceDate ? new Date(initialData.invoiceDate) : null);
  const [dueDateVal, setDueDateVal] = useState<Date | null>(initialData?.dueDate ? new Date(initialData.dueDate) : null);
  const [success, setSuccess] = useState<{ invoiceNumber?: string; amount?: string } | null>(null);

  // submit handler persists to API and calls parent with created invoice
  const submitHandler = async (data: FormValues) => {
    try {
      const payload = {
        invoiceNumber: data.invoiceId || undefined,
        customerName: data.customerName,
        customerEmail: data.contactDetails || undefined,
        invoiceDate: invoiceDateVal ? invoiceDateVal.toISOString() : undefined,
        dueDate: dueDateVal ? dueDateVal.toISOString() : undefined,
        amount: data.amountDue,
        status: data.paymentStatus || "pending",
      };

  const res = await apiFetch<{ invoice: import('@/types').Invoice }>('invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.error) return alert(res.error);

  // call parent callback with normalized invoice
      const created = res.data?.invoice;
      if (created) {
        onSubmit?.(created as Invoice);
        // clear form + show toast
        setSuccess({ invoiceNumber: created.invoiceNumber ?? undefined, amount: created.amount ?? undefined });
      }
      // reset fields
      (document.querySelector('form') as HTMLFormElement)?.reset();
      setInvoiceDateVal(null);
      setDueDateVal(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      {Object.keys(errors || {}).length > 0 && <div className="text-red-500">Please fix the errors.</div>}
      <div>
        <label>Invoice ID</label>
        <input
          type="text"
          defaultValue={initialData?.invoiceId}
          {...register("invoiceId")}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label>Customer Name</label>
        <input
          type="text"
          defaultValue={initialData?.customerName}
          {...register("customerName", { required: true })}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label>Contact Details</label>
        <input
          type="text"
          defaultValue={initialData?.contactDetails}
          {...register("contactDetails", { required: true })}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label>Invoice Date</label>
  <DatePicker selected={invoiceDateVal} onChange={(d: Date | null) => setInvoiceDateVal(d)} className="border p-2 w-full" />
      </div>
      <div>
        <label>Due Date</label>
  <DatePicker selected={dueDateVal} onChange={(d: Date | null) => setDueDateVal(d)} className="border p-2 w-full" />
      </div>
      <div>
        <label>Amount Due</label>
        <input
          type="number"
          defaultValue={initialData?.amountDue}
          {...register("amountDue", { required: true })}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label>Payment Status</label>
        <select
          defaultValue={initialData?.paymentStatus || "Pending"}
          {...register("paymentStatus")}
          className="border p-2 w-full"
        >
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed ${isSubmitting ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {isSubmitting ? "Saving..." : initialData ? "Update Invoice" : "Create Invoice"}
        </button>
      </div>

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <strong>Invoice created:</strong>
          <p>
            Invoice #{success.invoiceNumber} — ${success.amount}
          </p>
          <p>
            <Link href="/finance/invoices">View Invoices</Link>
          </p>
        </div>
      )}
    </form>
  );
}