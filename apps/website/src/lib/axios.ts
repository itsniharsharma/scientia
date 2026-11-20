import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { isBackendUnavailable } from './api-error';
import { wakeBackend } from './backend-wake';

export const api = axios.create({
  baseURL: '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Reads are retried after waking a hibernating backend; writes never are here
// — a lost response gives no way to know whether the server applied them.
const MAX_WAKE_RETRIES = 2;
type RetryableConfig = InternalAxiosRequestConfig & { _wakeRetries?: number };

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableConfig | undefined;
    const method = (config?.method ?? 'get').toLowerCase();
    if (
      config &&
      (method === 'get' || method === 'head') &&
      !axios.isCancel(error) &&
      isBackendUnavailable(error) &&
      (config._wakeRetries ?? 0) < MAX_WAKE_RETRIES
    ) {
      config._wakeRetries = (config._wakeRetries ?? 0) + 1;
      await wakeBackend();
      return api.request(config);
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    } else if (!error.response) {
      // Network error or timeout — no response from server
      error.message = 'Network error. Please check your connection.';
    }
    return Promise.reject(error);
  },
);
