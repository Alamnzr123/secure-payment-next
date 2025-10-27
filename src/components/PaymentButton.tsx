import React from 'react';

interface PaymentButtonProps {
  paymentLink: string;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ paymentLink }) => {
  const handlePayment = () => {
    window.location.href = paymentLink;
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