const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getApiUrl(path) {
  if (!path) return API_BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path}`;
}

/**
 * Central fetch wrapper.
 * - Automatically attaches the JWT from localStorage on every request.
 * - Throws on non-2xx responses with the server's error message.
 */
export async function request(path, options = {}) {
  // Read the stored user object and extract the token
  const stored = localStorage.getItem('agentsql-user');
  const token = stored ? JSON.parse(stored).token : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    // Surface the server's message for better UX error display
    const message = data?.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
}
