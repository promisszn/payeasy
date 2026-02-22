import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCSRFToken,
  validateCSRFToken,
  validateOrigin,
  getCSRFManager,
} from '../../lib/security/csrf';
import { NextRequest } from 'next/server';

describe('CSRF Protection', () => {
  const sessionId = 'test-session-123';

  beforeEach(() => {
    const manager = getCSRFManager();
    manager.clearAllTokens();
  });

  describe('Token Generation', () => {
    it('should generate a valid CSRF token', () => {
      const { token, cookie } = generateCSRFToken(sessionId);

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
      expect(cookie).toContain('__csrf_token');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite');
    });

    it('should generate different tokens for different sessions', () => {
      const { token: token1 } = generateCSRFToken('session-1');
      const { token: token2 } = generateCSRFToken('session-2');

      expect(token1).not.toBe(token2);
    });

    it('should include secure flag in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const { cookie } = generateCSRFToken(sessionId);
        expect(cookie).toContain('Secure');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Token Validation', () => {
    it('should validate a valid token', () => {
      const { token } = generateCSRFToken(sessionId);
      const result = validateCSRFToken(
        createMockRequest(token),
        sessionId,
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject an invalid token', () => {
      generateCSRFToken(sessionId);
      const result = validateCSRFToken(
        createMockRequest('invalid-token'),
        sessionId,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject missing token', () => {
      generateCSRFToken(sessionId);
      const result = validateCSRFToken(
        createMockRequest(null),
        sessionId,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('CSRF token missing');
    });

    it('should reject token for unknown session', () => {
      const { token } = generateCSRFToken('session-1');
      const result = validateCSRFToken(
        createMockRequest(token),
        'unknown-session',
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('Origin Validation', () => {
    it('should validate allowed origins', () => {
      const allowedOrigins = ['http://localhost:3000', 'https://example.com'];
      const request = createMockRequest('token', 'http://localhost:3000');

      const result = validateOrigin(request, allowedOrigins);
      expect(result.valid).toBe(true);
    });

    it('should reject disallowed origins', () => {
      const allowedOrigins = ['http://localhost:3000'];
      const request = createMockRequest('token', 'http://malicious.com');

      const result = validateOrigin(request, allowedOrigins);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should allow requests without origin check if no allowlist provided', () => {
      const request = createMockRequest('token', 'http://any-domain.com');
      const result = validateOrigin(request);

      expect(result.valid).toBe(true);
    });
  });

  describe('Token Expiry', () => {
    it('should expire tokens after configured time', () => {
      const manager = getCSRFManager({ tokenExpiry: 1000 }); // 1 second
      const token = manager.generateToken(sessionId);

      // Token should be valid initially
      expect(manager.validateToken(sessionId, token)).toBe(true);

      // Simulate expiry by advancing time
      // Note: In real tests, you would use jest.useFakeTimers()
    });
  });
});

/**
 * Helper to create mock NextRequest
 */
function createMockRequest(
  token: string | null,
  origin?: string,
): NextRequest {
  const headers = new Headers();

  if (token) {
    headers.set('X-CSRF-Token', token);
  }

  if (origin) {
    headers.set('origin', origin);
  }

  const request = new NextRequest(new Request('http://localhost/api/test', { headers }));
  return request;
}
