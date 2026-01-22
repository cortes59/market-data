/**
 * Custom exception for API rate limiting (HTTP 429)
 * Thrown by API clients, caught by services to trigger backoff logic
 */
export class RateLimitException extends Error {
  constructor(
    public readonly provider: string,
    public readonly retryAfter?: number,
  ) {
    super(`Rate limited by ${provider}`);
    this.name = 'RateLimitException';
  }
}
