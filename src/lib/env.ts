export function getApiBaseUrl(): string {
  const viteApiUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_API_BASE_URL
      : undefined;
  const nextPublicApiUrl =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined;

  const rawBaseUrl = (viteApiUrl || nextPublicApiUrl || '/api/v1').trim();
  const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');

  if (/^https?:\/\//i.test(normalizedBaseUrl)) {
    try {
      const configuredUrl = new URL(normalizedBaseUrl);

      if (typeof window !== 'undefined') {
        const isLocalDevHost = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
        const isConfiguredLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(configuredUrl.hostname);

        // In browser-based local development, always use the relative API path so
        // Vite proxying and same-origin Next routes keep working regardless of port.
        if (isLocalDevHost && isConfiguredLocalHost) {
          return '/api/v1';
        }
      }

      return configuredUrl.toString().replace(/\/$/, '');
    } catch (error) {
      console.warn('Invalid API base URL configuration. Falling back to /api/v1.', error);
      return '/api/v1';
    }
  }

  return normalizedBaseUrl.startsWith('/') ? normalizedBaseUrl : `/${normalizedBaseUrl}`;
}
