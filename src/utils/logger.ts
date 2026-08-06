import { env } from '@/config/env';

/**
 * Logging that is safe to leave in the codebase.
 *
 * Two rules it enforces:
 *  1. `debug` and `info` are silent outside development, so a release build
 *     does not narrate itself.
 *  2. Anything that looks like a credential is redacted before it is printed.
 *     Auth responses, refresh payloads and Axios configs all carry tokens, and
 *     a single `console.log(response.data)` during debugging is how they end up
 *     in a crash report.
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'otp_token',
  'code',
  'authorization',
  'push_token',
  'msisdn',
  'pan',
];

const REDACTED = '[redacted]';
const MAX_DEPTH = 4;

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive));
}

/** Deep-copies a value, replacing sensitive fields. Never mutates the input. */
export function redact(value: unknown, depth = 0): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[depth limit]';
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    result[key] = isSensitiveKey(key) ? REDACTED : redact(entry, depth + 1);
  }
  return result;
}

function emit(
  level: 'debug' | 'info' | 'warn' | 'error',
  scope: string,
  message: string,
  context?: unknown,
): void {
  const prefix = `[${scope}]`;
  const payload = context === undefined ? [] : [redact(context)];

  switch (level) {
    case 'debug':
    case 'info':
      if (!env.isDevelopment) return;
      console.log(prefix, message, ...payload);
      return;
    case 'warn':
      console.warn(prefix, message, ...payload);
      return;
    case 'error':
      console.error(prefix, message, ...payload);
  }
}

export type Logger = {
  debug(message: string, context?: unknown): void;
  info(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  error(message: string, context?: unknown): void;
};

/**
 * Creates a scoped logger: `createLogger('api')` prints `[api] …`.
 * Scope the logger per module rather than grepping for bare console calls.
 */
export function createLogger(scope: string): Logger {
  return {
    debug: (message, context) => emit('debug', scope, message, context),
    info: (message, context) => emit('info', scope, message, context),
    warn: (message, context) => emit('warn', scope, message, context),
    error: (message, context) => emit('error', scope, message, context),
  };
}

export const logger = createLogger('app');
