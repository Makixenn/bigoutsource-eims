let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
API_BASE_URL = API_BASE_URL.replace(/\/$/, '');
if (!API_BASE_URL.endsWith('/api')) {
  API_BASE_URL += '/api';
}
const TOKEN_KEY = 'eims_auth_token';
const REFRESH_TOKEN_KEY = 'eims_refresh_token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let isRefreshing = false;
let refreshPromise = null;

async function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');
  
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error('Refresh failed');
  }

  setAuthToken(payload.data.token);
  return payload.data.token;
}

export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  
  const makeRequest = async () => {
    const token = getAuthToken();
    const headers = {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('The server took too long to respond. It might be restarting or offline.');
      }
      throw error;
    }
  };

  let response = await makeRequest();

  if (response.status === 401 && path !== '/auth/refresh' && path !== '/auth/login' && path !== '/auth/login/mfa') {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = doRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    try {
      await refreshPromise;
      // Retry the original request
      response = await makeRequest();
    } catch (refreshError) {
      clearAuthToken();
      clearRefreshToken();
      // Let it fall through to throw the original 401
    }
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    throw new Error(payload.message || 'API request failed');
  }

  if (!contentType.includes('application/json')) {
    throw new Error('API returned a non-JSON response. Check VITE_API_BASE_URL and backend routing.');
  }

  if (payload.success === false) {
    throw new Error(payload.message || 'API request failed');
  }

  return payload.data;
}
