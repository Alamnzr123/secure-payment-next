import { logout, apiFetch } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const Header = () => {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

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

  const handleLogout = async () => {
    await logout();
    setAuthed(false);
    // redirect to login
    window.location.href = '/finance/login';
  };

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="sm:hidden p-2" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Micro-Lending Company</h1>
        </div>

        <nav className={`sm:block ${open ? 'block' : 'hidden'} mt-3 sm:mt-0`}>
          <ul className="flex flex-col sm:flex-row sm:space-x-4 items-start sm:items-center">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/finance/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link href="/finance/invoices">Invoices</Link>
            </li>
            <li>
              {authed === null ? null : authed ? (
                <button onClick={handleLogout} className="underline">Logout</button>
              ) : (
                <Link href="/finance/login">Login</Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;