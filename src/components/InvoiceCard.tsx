import React from 'react';

interface InvoiceCardProps {
  invoiceId: string;
  customerName: string;
  dueDate: string;
  amountDue: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  onViewDetails: () => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoiceId,
  customerName,
  dueDate,
  amountDue,
  paymentStatus,
  onViewDetails,
}) => {
  return (
    <div className="border rounded-lg p-4 shadow-md mb-4">
      <h3 className="text-lg font-semibold">Invoice #{invoiceId}</h3>
      <p className="text-gray-700">Customer: {customerName}</p>
      <p className="text-gray-700">Due Date: {dueDate}</p>
      <p className="text-gray-700">Amount Due: ${amountDue.toFixed(2)}</p>
      <p className={`text-${paymentStatus === 'Paid' ? 'green' : paymentStatus === 'Overdue' ? 'red' : 'yellow'}-600`}>
        Status: {paymentStatus}
      </p>
      <button
        onClick={onViewDetails}
        className="mt-2 bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600"
      >
        View Details
      </button>
    </div>
  );
};

export default InvoiceCard;