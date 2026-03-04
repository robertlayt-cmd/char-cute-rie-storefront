import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function AdminGuard({ children }) {
  const [status, setStatus] = useState('loading'); // loading | ok | denied

  useEffect(() => {
    base44.auth.me()
      .then(user => {
        if (user?.role === 'admin') setStatus('ok');
        else setStatus('denied');
      })
      .catch(() => setStatus('denied'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="dark min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (status === 'denied') {
    base44.auth.redirectToLogin(window.location.href);
    return null;
  }

  return children;
}