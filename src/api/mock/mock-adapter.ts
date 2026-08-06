import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_PREFIX } from '@/config/constants';
import { createLogger } from '@/utils/logger';

import { mockRoutes, type MockRequestContext, type MockRoute } from './routes';

/**
 * An Axios adapter that answers from `./routes.ts` instead of the network.
 *
 * Installing the mock at the *adapter* level (rather than as a separate service
 * layer) is what keeps features unaware of it: interceptors, error
 * normalization, auth headers and TanStack Query all behave exactly as they do
 * against a real backend.
 */

const log = createLogger('mock-api');

/** Enough delay for loading states to be visible without slowing tests down. */
const MOCK_LATENCY_MS = 120;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strips the base URL and `/v1` prefix, and drops any query string. */
function toRoutePath(url: string | undefined): string {
  if (!url) return '/';
  const withoutOrigin = url.replace(/^https?:\/\/[^/]+/i, '');
  const withoutQuery = withoutOrigin.split('?')[0] ?? '';
  const withoutPrefix = withoutQuery.startsWith(API_PREFIX)
    ? withoutQuery.slice(API_PREFIX.length)
    : withoutQuery;
  return withoutPrefix.startsWith('/') ? withoutPrefix : `/${withoutPrefix}`;
}

/** Matches `/trips/:id` against `/trips/trp_1`, capturing `{ id: 'trp_1' }`. */
function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = path.split('/').filter(Boolean);
  if (patternSegments.length !== pathSegments.length) return null;

  const params: Record<string, string> = {};
  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index]!;
    const pathSegment = pathSegments[index]!;
    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
    } else if (patternSegment !== pathSegment) {
      return null;
    }
  }
  return params;
}

function findRoute(
  method: string,
  path: string,
): { route: MockRoute; params: Record<string, string> } | null {
  for (const route of mockRoutes) {
    if (route.method !== method) continue;
    const params = matchPath(route.path, path);
    if (params) return { route, params };
  }
  return null;
}

function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data ?? null;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function buildResponse(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): AxiosResponse {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : String(status),
    headers: {},
    config,
    request: null,
  };
}

export function createMockAdapter(): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    await delay(MOCK_LATENCY_MS);

    const method = (config.method ?? 'get').toUpperCase();
    const path = toRoutePath(config.url);
    const match = findRoute(method, path);

    if (!match) {
      log.warn(`No fixture for ${method} ${path} — add one in src/api/mock/routes.ts`);
      const response = buildResponse(config, 501, {
        code: 'not_implemented',
        message: `Mock API: aucune donnée pour ${method} ${path}.`,
      });
      throw new AxiosError(
        `Mock API: no route for ${method} ${path}`,
        'ERR_BAD_RESPONSE',
        config,
        null,
        response,
      );
    }

    const context: MockRequestContext = {
      params: match.params,
      query: (config.params as Record<string, unknown> | undefined) ?? {},
      body: parseBody(config.data),
    };

    const { status, data } = match.route.handler(context);
    const response = buildResponse(config, status, data);

    if (status >= 200 && status < 300) {
      log.debug(`${method} ${path} → ${status}`);
      return response;
    }

    throw new AxiosError(
      `Mock API: ${method} ${path} responded ${status}`,
      status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST',
      config,
      null,
      response,
    );
  };
}
