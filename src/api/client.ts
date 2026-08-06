import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_PREFIX, REQUEST_ID_HEADER, REQUEST_TIMEOUT_MS } from '@/config/constants';
import { env } from '@/config/env';
import { createLogger } from '@/utils/logger';

import { getAuthBridge } from './auth-bridge';
import { normalizeError } from './errors';
import { createMockAdapter } from './mock/mock-adapter';
import { createRequestId } from './request-id';

/**
 * The single Axios instance.
 *
 * Responsibilities, in interceptor order:
 *   request  → correlation id, bearer token
 *   response → single retry after a token refresh, then error normalization
 *
 * Nothing else in the app creates an Axios instance. Features call the helpers
 * in `./request.ts`, which call this client.
 */

declare module 'axios' {
  // Per-request escape hatches, set by `RequestOptions` in `./request.ts`.
  export interface AxiosRequestConfig {
    /** Send without an `Authorization` header (public endpoints, auth calls). */
    skipAuth?: boolean;
    /** Do not attempt a refresh on 401 — used by the refresh call itself. */
    skipRefresh?: boolean;
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _hasRetriedAfterRefresh?: boolean };

const log = createLogger('api');

export const apiClient = axios.create({
  baseURL: `${env.apiUrl}${API_PREFIX}`,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Mock mode is installed at the transport layer, so no feature, query or
// component can tell the difference between fixtures and a real backend.
if (env.enableMockApi) {
  apiClient.defaults.adapter = createMockAdapter();
  log.info('Mock API enabled — requests are served from local fixtures.');
}

apiClient.interceptors.request.use((config) => {
  config.headers.set(REQUEST_ID_HEADER, createRequestId());

  if (!config.skipAuth) {
    const token = getAuthBridge().getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError) || error.response?.status !== 401) {
      return Promise.reject(normalizeError(error));
    }

    const config = error.config as RetriableConfig | undefined;
    const canRetry = config && !config.skipAuth && !config.skipRefresh;

    if (!canRetry || config._hasRetriedAfterRefresh) {
      return Promise.reject(normalizeError(error));
    }

    config._hasRetriedAfterRefresh = true;

    // `refreshAccessToken` is single-flight, so a screen firing four parallel
    // queries performs one refresh and replays all four.
    const token = await getAuthBridge().refreshAccessToken();

    if (!token) {
      getAuthBridge().onSessionExpired();
      return Promise.reject(normalizeError(error));
    }

    config.headers.set('Authorization', `Bearer ${token}`);
    return apiClient.request(config);
  },
);
