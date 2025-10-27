import { Invoice } from "@/types";

export const formatInvoiceDate = (date: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
};

export const calculateTotalAmountDue = (invoices: Invoice[]): number => {
  return invoices.reduce((total, invoice) => total + invoice.amountDue, 0);
};

export const validateInvoiceData = (invoice: Invoice): boolean => {
  const { customerName, amountDue, invoiceDate, dueDate } = invoice;
  return (
    !!customerName &&
    amountDue > 0 &&
    new Date(invoiceDate) <= new Date(dueDate)
  );
};

export const generateInvoiceIdentifier = (id: number): string => {
  return `Invoice #${id.toString().padStart(5, '0')}`;
};