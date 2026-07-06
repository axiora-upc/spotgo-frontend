export function formatError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    return err.message.includes('Resource not found')
      ? `${fallback}: not found`
      : err.message;
  }
  return fallback;
}
