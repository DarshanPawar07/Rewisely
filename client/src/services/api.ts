export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** Wake a sleeping host without blocking the page that the user is opening. */
export async function wakeBackend() {
  const healthUrl = `${API_URL.replace(/\/api\/?$/, '')}/health`;
  try {
    await fetch(healthUrl, { method: 'GET', cache: 'no-store' });
  } catch {
    // A cold start or temporary network failure should never stop the UI rendering.
  }
}

export type ApiResponse<T> = { success: boolean; data: T };

export async function apiRequest<T>(path: string, token: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  } catch {
    throw new Error('Cannot reach Rewisely right now. Check that the server is running and try again.');
  }
  const payload = await response.json().catch(() => ({ message: 'The server returned an invalid response' }));
  if (!response.ok) {
    const message = Array.isArray(payload.message) ? payload.message.join(' ') : payload.message;
    if (response.status >= 500 && (!message || /internal server error/i.test(message))) throw new Error('Something went wrong on our side. Please try again in a moment.');
    throw new Error(message || (response.status >= 500 ? 'Something went wrong on our side. Please try again in a moment.' : 'Request failed. Check your details and try again.'));
  }
  return payload as ApiResponse<T>;
}
