export function getApiBaseUrl(): string {
  const viteApiUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_API_BASE_URL
      : undefined;
  const nextPublicApiUrl =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined;

  // In the browser, always use a relative path so the API is called on the
  // same origin that served the page (works for any domain).
  if (typeof window !== 'undefined') {
    const isLocalDevHost = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    // In local dev, Vite proxies /api/* → Go backend. In production the
    // Next.js API routes handle everything on the same origin.
    if (isLocalDevHost) {
      return '/api/v1';
    }
    // Production: same origin, relative path.
    return '/api/v1';
  }

  // Server-side rendering (Next.js): use the configured URL or fallback.
  const rawBaseUrl = (nextPublicApiUrl || viteApiUrl || '/api/v1').trim();
  const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');

  if (/^https?:\/\//i.test(normalizedBaseUrl)) {
    try {
      const configuredUrl = new URL(normalizedBaseUrl);
      return configuredUrl.toString().replace(/\/$/, '');
    } catch {
      return '/api/v1';
    }
  }

  return normalizedBaseUrl.startsWith('/') ? normalizedBaseUrl : `/${normalizedBaseUrl}`;
}
