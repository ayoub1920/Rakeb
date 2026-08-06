/**
 * Correlation IDs.
 *
 * Every outgoing request carries an `x-request-id`. The value comes back on
 * `ApiError.requestId`, which is what a user attaches to a support ticket and
 * what makes a single failure findable in the Nest logs.
 *
 * Not a UUID and not cryptographic — uniqueness only has to hold within one
 * device's session.
 */

let counter = 0;

export function createRequestId(): string {
  counter = (counter + 1) % 1_000_000;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `rkb-${timestamp}-${counter.toString(36)}${random}`;
}
