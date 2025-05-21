import { config } from "dotenv";
import { BaseCrawler } from "../crawler/base-crawler";

config({ path: ".env.local" });

async function testCrawler() {
  const crawler = new BaseCrawler()

  try {
    const page = await crawler.crawlPage("https://www.google.com");

    const title = await page.title();
    console.log("Crawler test passed!");
    console.log("page title:", title);


    await crawler.close();
  } catch (error) {
    console.error("Crawler test failed:", error);
  }
}

testCrawler();
