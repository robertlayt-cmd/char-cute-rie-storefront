import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorLogger from '@/components/ErrorLogger';

export default function Layout({ children }) {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return (
    <>
      <ErrorLogger />
      {children}
    </>
  );
}