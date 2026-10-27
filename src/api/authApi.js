const TOKEN_KEY = 'adobe-automation-token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const storeToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api/auth${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed. Please try again.');
    error.code = data.code;
    throw error;
  }
  return data;
}

export const signIn = (email, password) => request('/signin', { method: 'POST', body: { email, password } });

export const signUp = (details) => request('/signup', { method: 'POST', body: details });

export const fetchCurrentUser = (token) => request('/me', { token });

export const updateProfile = (token, details) => request('/me', { method: 'PUT', body: details, token });

async function adminRequest(path, options) {
  const base = '/api/admin';
  const { method = 'GET', body, token } = options;
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed. Please try again.');
  return data;
}

export const adminListUsers = (token) => adminRequest('/users', { token });
export const adminGetUser = (token, id) => adminRequest(`/users/${id}`, { token });
export const adminUpdateUser = (token, id, details) => adminRequest(`/users/${id}`, { method: 'PUT', body: details, token });
export const adminSetRole = (token, id, role) => adminRequest(`/users/${id}/role`, { method: 'PUT', body: { role }, token });
export const adminDeleteUser = (token, id) => adminRequest(`/users/${id}`, { method: 'DELETE', token });
