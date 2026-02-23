/**
 * Force all API routes to be dynamic so they are not statically analyzed
 * during build (avoids cookies()/headers() without request context).
 */
export const dynamic = 'force-dynamic';

export default function ApiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
