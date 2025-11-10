import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';

const SuccessPage = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    if (!session_id) return;
    const confirm = async () => {
      try {
        // Optionally, call a server endpoint to verify session and mark invoice paid
        await axios.post('/api/stripe/confirm-payment', { sessionId: session_id });
        setMessage('Payment successful. Thank you!');
      } catch (err) {
        setMessage('Payment succeeded but verification failed. Please contact support.');
      }
    };
    confirm();
  }, [session_id]);

  return <div className="p-4">{message}</div>;
};

export default SuccessPage;
