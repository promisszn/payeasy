/**
 * CSRF form utilities
 * Helpers for adding CSRF tokens to form submissions
 */

/**
 * Prepare fetch options with CSRF token
 */
export function addCSRFToFetch(
  options: RequestInit = {},
  csrfToken: string,
): RequestInit {
  return {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
    },
  };
}

/**
 * Prepare FormData with CSRF token
 */
export function addCSRFToFormData(
  formData: FormData,
  csrfToken: string,
): FormData {
  formData.append('csrf_token', csrfToken);
  return formData;
}

/**
 * Create a form submission handler that includes CSRF token
 */
export function createFormSubmitHandler(
  csrfToken: string,
  onSubmit: (data: FormData) => Promise<void>,
) {
  return async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    addCSRFToFormData(formData, csrfToken);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    }
  };
}

/**
 * Extract CSRF token from HTML meta tag
 * Usage: <meta name="csrf-token" content="token-value" />
 */
export function getCSRFTokenFromMetaTag(): string | null {
  if (typeof document === 'undefined') return null;

  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute('content') || null;
}

/**
 * Extract CSRF token from document cookie
 */
export function getCSRFTokenFromCookie(cookieName: string = '__csrf_token'): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = `${cookieName}=`;
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}
