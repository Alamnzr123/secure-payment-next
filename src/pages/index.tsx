import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch('auth');
        if (!mounted) return;
        setAuthed(!res.error);
      } catch {
        if (!mounted) return;
        setAuthed(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAuthClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('auth');
      if (!res.error) router.push('/finance/dashboard');
      else router.push('/finance/login');
    } catch {
      router.push('/finance/login');
    }
  };
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black`}
    >
      <main className="w-full max-w-4xl bg-white dark:bg-black rounded-lg shadow-md p-10">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Image src="/next.svg" alt="Logo" width={56} height={16} priority />
            <h1 className="text-2xl font-semibold">AR Micro-Lending — Accounts Receivable</h1>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Finance Manager (Creditor)</h2>
            <p className="text-sm text-zinc-600 mb-4">
              Authenticate, create and manage invoices, generate secure payment links, search and filter invoices,
              track payment status and customers.
            </p>

            <ul className="text-sm space-y-2 mb-4">
              <li>• Create invoices (invoice number, customer, dates, amount, status)</li>
              <li>• View / search / filter invoice list</li>
              <li>• Generate one-click payment links</li>
              <li>• Secure login with username/password (JWT + cookies)</li>
            </ul>

            <div className="flex gap-2">
              <Link href="/finance/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded">
                Go to Dashboard
              </Link>
              <a href="#" onClick={handleAuthClick} className="px-4 py-2 border rounded">
                {authed === null ? 'Sign in' : authed ? 'Dashboard' : 'Sign in'}
              </a>
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Customer (Debtor)</h2>
            <p className="text-sm text-zinc-600 mb-4">
              No login required. Customers open a payment link to view invoice details and complete payment through a
              secure gateway.
            </p>

            <ul className="text-sm space-y-2 mb-4">
              <li>• Open payment link (tokenized URL)</li>
              <li>• View invoice summary and pay</li>
              <li>• Link expiration and single-use protection</li>
            </ul>

            <div className="flex gap-2">
              <Link href="/invoices/sample-token" className="px-4 py-2 bg-white text-black rounded border">
                Sample Payment Link
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 p-6 border rounded-lg">
          <h3 className="text-md font-semibold mb-2">Quick setup & notes</h3>
          <ul className="text-sm space-y-2 text-zinc-600">
            <li>• Database: PostgreSQL (set DATABASE_URL in .env for Prisma).</li>
            <li>• ORM: Prisma — run npx prisma generate and npx prisma migrate dev --name init after configuring .env.</li>
            <li>• Auth: Finance Manager users use username/password; server issues JWT in httpOnly cookie.</li>
            <li>• Payment links: tokenized PaymentLink model with expiration and used flag.</li>
            <li>• Tech decisions: Next.js Pages Router (existing src/pages), Tailwind for UI, Prisma + pg for DB access.</li>
          </ul>
        </section>

        <section className="mt-6 text-sm text-zinc-700 dark:text-zinc-300">
          <h4 className="font-semibold">Assumptions & design decisions</h4>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Single finance manager role for MVP; additional roles can be added to User.role.</li>
            <li>Payment gateway integration is abstracted behind a /api/payments route; sample token flow provided.</li>
            <li>Payment links are tokenized and can be single-use or expire after a configurable time.</li>
            <li>Pages Router is used to match your current project layout (src/pages/_app.tsx exists).</li>
          </ol>
        </section>
      </main>
    </div>
  );
}