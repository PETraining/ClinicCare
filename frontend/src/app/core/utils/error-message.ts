export function extractErrorMessage(err: any, fallback: string): string {
  const detail = err?.error?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map(d => d?.msg ?? JSON.stringify(d)).join('; ');
  }
  return fallback;
}
