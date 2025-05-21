import { chromium, Browser, Page } from "playwright";

export class BaseCrawler {
  private browser: Browser | null = null;

  async initialize() {
    this.browser = await chromium.launch({ headless: true });

    console.log("Browser initialized");
  }

  async crawlPage(url: string) {
    if (!this.browser) {
      console.log("Initialize browser");
      await this.initialize();
    }

    const context = await this.browser!.newContext({
      // setting a realistic user agent
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      // setting a realistic viewport size
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    try {
      console.log(`Navigating to ${url}`);

      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000, // 30 seconds
      });

      console.log(`Successfully loaded ${url}`);

      return page;
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log("Browser closed");
    }
  }
}
