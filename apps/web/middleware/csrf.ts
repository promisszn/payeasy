import { NextRequest, NextResponse } from 'next/server';
import {
  csrfProtectionMiddleware,
  generateCSRFToken,
  getSessionId,
} from '@/lib/security/csrf';

/**
 * CSRF protection middleware for Next.js
 * Validates CSRF tokens on state-changing requests
 */
export async function csrfMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const sessionId = getSessionId(request);

  // Protect state-changing operations
  const protectionResult = await csrfProtectionMiddleware(request, sessionId, {
    allowedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    ].filter(Boolean),
    exempt: ['/api/health', '/api/auth/login', '/api/auth/callback'],
  });

  // Return error response if protection failed
  if (protectionResult) {
    return protectionResult;
  }

  // Add new CSRF token to response for next request
  const response = NextResponse.next();
  const { token, cookie } = generateCSRFToken(sessionId);

  // Set CSRF token cookie
  response.headers.append('Set-Cookie', cookie);

  // Also send token in response body for client-side consumption
  response.headers.set('X-CSRF-Token', token);

  return response;
}
