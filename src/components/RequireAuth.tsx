import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const { getCurrentUser } = await import('@/lib/api');
        const res = await getCurrentUser();
        if (!mounted) return;
        if (res.error) {
          router.replace('/finance/login');
          return;
        }
        setChecking(false);
      } catch {
        if (!mounted) return;
        router.replace('/finance/login');
      }
    };
    check();
    return () => { mounted = false; };
  }, [router]);

  if (checking) return <div>Checking authentication...</div>;
  return <>{children}</>;
}
