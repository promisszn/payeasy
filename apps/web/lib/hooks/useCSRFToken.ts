import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to manage CSRF tokens in forms
 * Automatically fetches and manages CSRF token for form submissions
 */
export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get token from response headers or cookie
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const nameEQ = `${name}=`;
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(nameEQ)) {
          return decodeURIComponent(cookie.substring(nameEQ.length));
        }
      }
      return null;
    };

    try {
      // First try to get from cookie
      let csrfToken = getCookie('__csrf_token');

      if (!csrfToken) {
        // If not in cookie, request a new one
        fetch('/api/csrf-token', { method: 'GET' })
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch CSRF token');
            const tokenFromHeader = res.headers.get('X-CSRF-Token');
            if (tokenFromHeader) {
              setToken(tokenFromHeader);
            } else {
              csrfToken = getCookie('__csrf_token');
              setToken(csrfToken);
            }
          })
          .catch((err) => {
            setError(err.message);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setToken(csrfToken);
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, []);

  const addToFormData = useCallback(
    (formData: FormData): FormData => {
      if (token) {
        formData.append('csrf_token', token);
      }
      return formData;
    },
    [token],
  );

  const getHeader = useCallback((): Record<string, string> => {
    return token ? { 'X-CSRF-Token': token } : {};
  }, [token]);

  return {
    token,
    error,
    isLoading,
    addToFormData,
    getHeader,
  };
}
