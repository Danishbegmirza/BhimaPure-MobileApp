import { clearAuthData } from '../storage/auth';
import { resetToLogin } from '../navigation/navigationRef';

/**
 * Authenticated fetch wrapper.
 *
 * - Parses the JSON body automatically.
 * - If the server returns HTTP 401 OR a body with `message: "Unauthenticated"`
 *   (or "token expired" / "Token expired"), it clears stored credentials and
 *   resets navigation to the Login screen.
 * - Throws an `UnauthenticatedError` so callers can bail out early.
 */

export class UnauthenticatedError extends Error {
  constructor() {
    super('Unauthenticated');
    this.name = 'UnauthenticatedError';
  }
}

function isUnauthenticatedMessage(message?: string): boolean {
  if (!message) { return false; }
  const lower = message.toLowerCase();
  return (
    lower === 'unauthenticated' ||
    lower.includes('token expired') ||
    lower.includes('unauthenticated')
  );
}

export async function authFetch<T = unknown>(
  url: string,
  options: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);
  const data = (await response.json()) as { message?: string } & T;

  if (response.status === 401 || isUnauthenticatedMessage(data?.message)) {
    await clearAuthData();
    resetToLogin();
    throw new UnauthenticatedError();
  }

  return data;
}
