import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';

const CheckoutPage = () => {
  const router = useRouter();
  const { invoiceId } = router.query;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;
    const createSession = async () => {
      setLoading(true);
      try {
        const res = await axios.post('/api/stripe/create-checkout-session', { invoiceId });
        if (res.data?.url) {
          window.location.href = res.data.url;
        } else {
          setError('Failed to create checkout session');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        setLoading(false);
      }
    };
    createSession();
  }, [invoiceId]);

  if (loading) return <div className="p-4">Redirecting to payment...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  return <div className="p-4">Preparing payment...</div>;
};

export default CheckoutPage;
