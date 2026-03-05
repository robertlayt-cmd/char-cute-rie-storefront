import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorLogger from '@/components/ErrorLogger';
import useTheme from '@/components/theme/useTheme';

export default function Layout({ children }) {
  const { pathname, search } = useLocation();
  useTheme();

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