import React from 'react';

interface PaymentButtonProps {
  paymentLink?: string;
  invoiceId?: string;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ paymentLink, invoiceId }) => {
  const handlePayment = () => {
    if (paymentLink) {
      window.location.href = paymentLink;
      return;
    }
    if (invoiceId) {
      window.location.href = `/checkout/${invoiceId}`;
      return;
    }
    // fallback: do nothing
  };

  return (
    <button
      onClick={handlePayment}
      className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
    >
      Pay Now
    </button>
  );
};

export default PaymentButton;