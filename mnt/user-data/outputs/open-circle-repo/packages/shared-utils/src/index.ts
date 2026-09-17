// ─────────────────────────────────────────────────────────────────────────────
// Relay — Shared Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fills {{placeholder}} variables in a template string with provided data.
 *
 * @example
 * fillTemplate("Hello {{name}}, your order {{orderId}} is ready.", { name: "Kasun", orderId: "#123" })
 * // → "Hello Kasun, your order #123 is ready."
 */
export function fillTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = data[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

/**
 * Extracts all {{placeholder}} variable names from a template string.
 *
 * @example
 * extractVariables("Hello {{name}}, order {{orderId}}.")
 * // → ["name", "orderId"]
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
}

/**
 * Calculates exponential backoff delay in milliseconds.
 * Used by workers to determine how long to wait before retrying.
 *
 * Attempt 1 → 30,000ms  (30 seconds)
 * Attempt 2 → 120,000ms (2 minutes)
 * Attempt 3 → 300,000ms (5 minutes)
 */
export function calculateBackoffMs(attemptNumber: number, baseMs = 30_000): number {
  const delays = [baseMs, baseMs * 4, baseMs * 10];
  return delays[Math.min(attemptNumber - 1, delays.length - 1)];
}

/**
 * Masks sensitive strings for safe logging.
 * e.g. "oc_live_xk29dj3n" → "oc_live_****3n"
 */
export function maskSecret(secret: string, visibleChars = 4): string {
  if (secret.length <= visibleChars) return '****';
  return secret.slice(0, visibleChars) + '****' + secret.slice(-2);
}

/**
 * Safely parses JSON — returns null on failure instead of throwing.
 */
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Generates an API key with a given prefix.
 * e.g. "relay_live_a1b2c3d4e5f6g7h8"
 * NOTE: Store only the hash, never the plain key.
 */
export function generateApiKeyString(prefix: 'relay_live' | 'relay_test'): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const random = Array.from({ length: 24 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
  return `${prefix}_${random}`;
}

/**
 * Returns true if the value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
