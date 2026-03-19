export function getApiBaseUrl(): string {
  const nextPublicApiUrl =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined;

  return (nextPublicApiUrl || '/api/v1').replace(/\/$/, '');
}
