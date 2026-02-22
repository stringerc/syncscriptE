import { type ReactNode } from 'react';
import { useLocation } from 'react-router';

const MARKETING_PATHS = new Set(['/', '/features', '/pricing', '/faq', '/contact', '/about', '/blog', '/careers', '/press', '/docs', '/help', '/api-reference', '/community', '/privacy', '/terms', '/security', '/login', '/signup', '/auth', '/forgot-password']);

function isMarketingRoute(pathname: string): boolean {
  if (MARKETING_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/blog/')) return true;
  return false;
}

export function DashboardOnly({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  if (isMarketingRoute(pathname)) return null;
  return <>{children}</>;
}
