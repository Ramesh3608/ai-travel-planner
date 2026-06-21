const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Thin wrapper around fetch. `credentials: 'include'` is what makes the
 * httpOnly auth cookie travel with every request -- there is no token to
 * manually attach in JS because the backend deliberately keeps it out of
 * reach of client-side code (see backend/middleware/auth.js).
 */
async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_e) {
    // no JSON body (e.g. 204) - fine
  }

  if (!res.ok) {
    const message = data?.message || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
