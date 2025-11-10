import { useState } from 'react';
import axios from 'axios';

const WebhooksPage = () => {
  const [invoiceId, setInvoiceId] = useState('');
  const [type, setType] = useState('checkout.session.completed');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const trigger = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/stripe/trigger-test-webhook', { type, invoiceId: invoiceId || null });
      setResult(res.data);
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : 'request failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Stripe webhooks (test)</h2>
      <div className="mb-2">
        <label className="block text-sm text-gray-600">Event type</label>
        <input className="border p-2 w-full" value={type} onChange={(e) => setType(e.target.value)} />
      </div>
      <div className="mb-2">
        <label className="block text-sm text-gray-600">Invoice ID (optional)</label>
        <input className="border p-2 w-full" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={trigger} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? 'Sending…' : 'Trigger webhook'}
        </button>
      </div>

      {result && (
        <pre className="mt-4 bg-gray-100 p-3 rounded text-sm">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
};

export default WebhooksPage;
