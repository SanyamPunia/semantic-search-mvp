import { Page } from "playwright";
import { BaseCrawler } from "../base-crawler";
import { Product } from "@/types/product";
import { RetailerCrawler } from "../retailer-crawler";

/**
 * crawler for the iconic website
 * @param page - playwright page object
 * @returns product data
 */
export class TheIconicCrawler extends BaseCrawler implements RetailerCrawler {
    /**
     * extract product data from a product page
     * @param page - playwright page object
     * @returns product data
     */
    async extractProductPage(page: Page): Promise<Product> {
        try {

        } catch (error) {

        }
    }
}