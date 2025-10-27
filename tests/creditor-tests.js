import axios from 'axios';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function run() {
  console.log('Running Creditor tests against', BASE);

  // Test 1: Successful login
  try {
    const res = await axios.post(`${BASE}/api/auth`, { email: 'finance@local', password: 'securepassword' }, { validateStatus: () => true });
    console.log('Test 1 (login) status:', res.status);
    if (res.status === 200) console.log('  OK: Login succeeded');
    else console.log('  FAIL: Login failed', res.data);
  } catch (err) {
    console.error('Test 1 error', err.message);
  }

  // Test 3: Create invoice
  try {
    const payload = {
      invoiceNumber: 'INV-12345',
      customerName: 'John Doe',
      customerEmail: 'contact@john.com',
      invoiceDate: '2023-09-25',
      dueDate: '2023-10-10',
      amount: '500.00',
      status: 'PENDING',
    };
    const res = await axios.post(`${BASE}/api/invoices`, payload, { validateStatus: () => true });
    console.log('Test 3 (create invoice) status:', res.status);
    if (res.status === 201) console.log('  OK: Invoice created', res.data.invoice?.invoiceNumber || res.data.invoice?.id);
    else console.log('  FAIL: Create invoice', res.data);
  } catch (err) {
    console.error('Test 3 error', err.message);
  }

  // Test 5: View invoices
  try {
    const res = await axios.get(`${BASE}/api/invoices`, { validateStatus: () => true });
    console.log('Test 5 (list invoices) status:', res.status);
    if (res.status === 200) console.log('  OK: Found', (res.data.invoices || []).length, 'invoices');
    else console.log('  FAIL: List invoices', res.data);
  } catch (err) {
    console.error('Test 5 error', err.message);
  }

  // Test 8: Generate payment link (requires invoice id from previous create)
  try {
    // attempt to locate invoice by number
    const list = await axios.get(`${BASE}/api/invoices`);
    const inv = (list.data.invoices || []).find((i) => i.invoiceNumber === 'INV-12345');
    if (!inv) {
      console.log('Test 8 skipped: invoice not found');
    } else {
      const res = await axios.post(`${BASE}/api/payment-links`, { invoiceId: inv.id, expiresHours: 24 }, { validateStatus: () => true });
      console.log('Test 8 (generate link) status:', res.status);
      if (res.status === 201) console.log('  OK: Payment link generated', res.data.url || res.data.token);
      else console.log('  FAIL: Generate link', res.data);
    }
  } catch (err) {
    console.error('Test 8 error', err.message);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
