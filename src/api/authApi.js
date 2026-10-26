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
