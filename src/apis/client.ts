import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api/v1' : '/api/v1');

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 15_000,
});

let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<string> | null = null;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original?._retry || original?.url?.includes('/auth/')) {
      throw error;
    }
    original._retry = true;
    refreshing ??= api.post('/auth/refresh').then((response) => {
      const token = response.data.data.accessToken as string;
      setAccessToken(token);
      return token;
    }).finally(() => { refreshing = null; });
    original.headers.Authorization = `Bearer ${await refreshing}`;
    return api(original);
  },
);
