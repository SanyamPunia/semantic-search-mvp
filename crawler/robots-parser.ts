/**
 * robots.txt parser to respect crawling rules
 */
export class RobotsParser {
  private cache: Map<
    string,
    {
      allowedPaths: string[];
      disallowedPaths: string[];
      crawlDelay: number;
    }
  > = new Map();

  /**
   * fetch and parse robots.txt file
   * @param domain - domain to fetch robots.txt for
   */
  async parseRobotsTxt(domain: string) {
    // if already in cache, return cached result
    if (this.cache.has(domain)) {
      return this.cache.get(domain);
    }

    try {
      // fetch robots.txt file
      const response = await fetch(`https://${domain}/robots.txt`);

      // if not found, assume it's ok to crawl
      if (!response.ok) {
        const defaultRules = {
          allowedPaths: ["*"],
          disallowedPaths: [],
          crawlDelay: 1,
        };
        this.cache.set(domain, defaultRules);
        return defaultRules;
      }

      // parse the content
      const text = await response.text();
      const lines = text.split("\n");

      const allowedPaths: string[] = [];
      const disallowedPaths: string[] = [];
      let crawlDelay = 1; // default 1 second delay

      let isRelevantUserAgent = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // skip comments and empty lines
        if (trimmedLine.startsWith("#") || trimmedLine === "") {
          continue;
        }

        // check if this section applies to us
        if (trimmedLine.startsWith("User-agent:")) {
          const userAgent = trimmedLine.split(":")[1].trim();
          isRelevantUserAgent =
            userAgent === "*" || userAgent.toLowerCase() === "googlebot";

          continue;
        }

        // if this section doesn't apply to us, skip
        if (!isRelevantUserAgent) {
          continue;
        }

        // parse allow rules
        if (trimmedLine.startsWith("Allow:")) {
          const paths = trimmedLine.split(":")[1].trim();
          allowedPaths.push(paths);
        }

        // parse disallow rules
        if (trimmedLine.startsWith("Disallow:")) {
          const path = trimmedLine.split(":")[1].trim();
          // empty disallow means allow all
          if (path) {
            disallowedPaths.push(path);
          }
        }

        // parse crawl delay
        if (trimmedLine.startsWith("Crawl-delay:")) {
          const delay = parseInt(trimmedLine.split(":")[1].trim(), 10);
          if (!isNaN(delay)) {
            crawlDelay = delay;
          }
        }
      }

      // if no rules found, assume everything is allowed
      if (allowedPaths.length === 0 && disallowedPaths.length === 0) {
        allowedPaths.push("*");
      }

      // cache and return the result
      const rules = {
        allowedPaths,
        disallowedPaths,
        crawlDelay,
      };

      this.cache.set(domain, rules);
      return rules;
    } catch (error) {
      console.error(`Error parsing robots.txt for ${domain}:`, error);

      // on error, assume everything is allowed
      const defaultRules = {
        allowedPaths: ["*"],
        disallowedPaths: [],
        crawlDelay: 1,
      };
      this.cache.set(domain, defaultRules);
      return defaultRules;
    }
  }

  /**
   * check if a url is allowed to be crawled
   * @param url - url to check
   * @returns true if allowed, false otherwise
   */
  async isAllowed(url: string): Promise<boolean> {
    const { hostname, pathname } = new URL(url);

    // parse robots.txt for this domain
    const data = await this.parseRobotsTxt(hostname);
    if (!data) {
      return true;
    }

    const { allowedPaths, disallowedPaths } = data;

    // check if path is explicitly disallowed
    for (const disallowedPath of disallowedPaths) {
      if (disallowedPath === "*" || pathname.startsWith(disallowedPath)) {
        return false;
      }
    }

    // check if path is explicitly allowed
    for (const allowedPath of allowedPaths) {
      if (allowedPath === "*" || pathname.startsWith(allowedPath)) {
        return true;
      }
    }

    // if no rules apply, default to allowed
    return true;
  }

  /**
   * get crawl delay for a domain
   * @param domain - domain to get crawl delay for
   * @returns crawl delay in seconds
   */
  async getCrawlDelay(domain: string): Promise<number> {
    const data = await this.parseRobotsTxt(domain);
    return data?.crawlDelay || 1;
  }
}
