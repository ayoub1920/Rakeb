import type { AxiosRequestConfig } from 'axios';

import type { RequestOptions } from '@/types/api';

import { apiClient } from './client';

/**
 * Thin typed helpers over the Axios client.
 *
 * Feature `api.ts` files use these instead of `apiClient` directly, so that a
 * feature never sees an `AxiosResponse` and never has to remember to unwrap
 * `.data`. Errors are already normalized to `ApiError` by the client's
 * response interceptor.
 */

function toConfig(options?: RequestOptions): AxiosRequestConfig {
  return {
    skipAuth: options?.skipAuth,
    skipRefresh: options?.skipRefresh,
    signal: options?.signal,
  };
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, unknown>,
  options?: RequestOptions,
): Promise<T> {
  const response = await apiClient.get<T>(url, { ...toConfig(options), params });
  return response.data;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const response = await apiClient.post<T>(url, body, toConfig(options));
  return response.data;
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const response = await apiClient.patch<T>(url, body, toConfig(options));
  return response.data;
}

export async function apiPut<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
  const response = await apiClient.put<T>(url, body, toConfig(options));
  return response.data;
}

export async function apiDelete<T = void>(url: string, options?: RequestOptions): Promise<T> {
  const response = await apiClient.delete<T>(url, toConfig(options));
  return response.data;
}
