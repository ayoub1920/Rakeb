/**
 * Assertions used at boundaries where a violated expectation is a programming
 * error, not a user-facing failure. API failures are `ApiError`s and belong in
 * `src/api/errors.ts` — do not assert on them.
 */

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

/** Narrows `condition` to `true` for the rest of the scope. */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message);
  }
}

/** Narrows away `null | undefined` and returns the value, so it can be inlined. */
export function assertDefined<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new AssertionError(message);
  }
  return value;
}

/**
 * Exhaustiveness check for discriminated unions. Placed in the `default` branch
 * of a switch, it turns a newly added variant into a compile error.
 *
 * ```ts
 * switch (booking.status) {
 *   case 'pending': return …;
 *   default: return assertNever(booking.status, 'booking status');
 * }
 * ```
 */
export function assertNever(value: never, label = 'value'): never {
  throw new AssertionError(`Unhandled ${label}: ${JSON.stringify(value)}`);
}
