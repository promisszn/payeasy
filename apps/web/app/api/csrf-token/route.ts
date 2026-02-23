import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, getSessionId } from '@/lib/security/csrf';

/**
 * GET /api/csrf-token
 * Returns a CSRF token for the client to use in form submissions
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionId = getSessionId(request);
    const { token, cookie } = generateCSRFToken(sessionId);

    const response = NextResponse.json({ token });

    // Set CSRF token cookie
    response.headers.append('Set-Cookie', cookie);

    // Send token in header for easy client-side access
    response.headers.set('X-CSRF-Token', token);

    return response;
  } catch (error) {
    console.error('[CSRF] Token generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 },
    );
  }
}

/**
 * POST requests are not allowed on this endpoint
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
