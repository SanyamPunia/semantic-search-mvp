/**
 * rate limiter to avoid overloading websites
 */
export class RateLimiter {
  private limits: Map<
    string,
    {
      lastRequest: number;
      requestsPerMinute: number;
    }
  > = new Map();

  /**
   * set rate limit for a domain
   * @param domain - domain to set rate limit for
   * @param requestsPerMinute - number of requests per minute
   */
  setLimit(domain: string, requestsPerMinute: number) {
    this.limits.set(domain, {
      lastRequest: 0,
      requestsPerMinute,
    });
  }

  /**
   * check if a request to a domain should be delayed
   * @param domain - domain to check rate limit for
   * @returns promise that resolves when it's safe to make the request
   */
  async checkLimit(url: string) {
    // extract domain from url
    const domain = new URL(url).hostname;

    // get limit for this domain
    const limit = this.limits.get(domain);

    // if no limit is set, use default (10 rpm)
    const requestsPerMinute = limit?.requestsPerMinute || 10;

    // calculate minimum time between requests in ms
    const minTimeBetweenRequests = (1000 * 60) / requestsPerMinute;

    // get current time
    const now = Date.now();

    // get time of last request
    const lastRequest = limit?.lastRequest || 0;

    // calculate time to wait
    const timeToWait = Math.max(0, lastRequest + minTimeBetweenRequests - now);

    if (timeToWait > 0) {
      console.log(
        `Rate limiting: waiting ${timeToWait}ms before requesting ${url}`
      );

      await new Promise((resolve) => setTimeout(resolve, timeToWait));
    }

    this.limits.set(domain, {
      lastRequest: Date.now(),
      requestsPerMinute,
    });
  }
}
