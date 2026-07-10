export function formatError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const apiError = err as Error & { status?: number; code?: string };
    if (apiError.status === 401) return 'Your session has expired. Please sign in again.';
    if (apiError.status === 403) return 'You do not have permission to perform this action.';
    if (apiError.status === 409) return err.message || 'The requested action conflicts with the current state.';
    if (apiError.status === 429) return 'Too many attempts. Please wait a moment and try again.';
    return err.message.includes('Resource not found')
      ? `${fallback}: not found`
      : err.message;
  }
  return fallback;
}
