import { Page } from "playwright";
import { Product } from "@/types/product";
import { BaseCrawler } from "./base-crawler";

/**
 * interface for retailer specific crawler
 */
export interface RetailerCrawler {
  /**
   * extract product data from a product page
   * @param page - playwright page object
   * @returns product data
   */
  extractProductData(page: Page): Promise<Product>;

  /**
   * crawl a product page and extract data
   * @param url - product page url
   * @returns product data
   */
  crawlProductPage(url: string): Promise<Product>;

  /**
   * crawl a category page and extract product urls
   * @param categoryUrl - category page url
   * @param maxProducts - maximum number of products to crawl
   * @returns array of product data
   */
  crawlCategoryPage(
    categoryUrl: string,
    maxProducts?: number
  ): Promise<Product[]>;
}
