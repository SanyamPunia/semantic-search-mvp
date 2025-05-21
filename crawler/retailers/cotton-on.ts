import { Page } from "playwright";
import { BaseCrawler } from "../base-crawler";
import { RetailerCrawler } from "../retailer-crawler";
import { Product } from "@/types/product";

/**
 * crawler for cotton on website
 * Note: this crawler is just for testing purposes
 */
export class CottonOnCrawler extends BaseCrawler implements RetailerCrawler {
  /**
   * extract product data from a product page
   * @params page - playwright page object
   * @returns product data
   */
  async extractProductData(page: Page): Promise<Product> {
    // wait for important elements to be available
    await page.waitForSelector(".product-title", { timeout: 5000 });

    try {
      // extract product title
      const title = await page.$eval(
        ".product-title",
        (el) => el.textContent?.trim() || ""
      );

      // extract product price
      const price = await page.$eval(".product-price", (el) => {
        const priceText = el.textContent?.trim() || "";

        // remove curreny symbol and convert to number
        return parseFloat(priceText.replace(/[^0-9.]/g, ""));
      });

      let salePrice: number | undefined;
      try {
        salePrice = await page.$eval(".product-sale-price", (el) => {
          const priceText = el.textContent?.trim() || "";
          return parseFloat(priceText.replace(/[^0-9.]/g, ""));
        });
      } catch (error) {
        // no sale price available
        salePrice = undefined;
      }

      // extract product description
      const description = await page.$eval(
        ".product-description",
        (el) => el.textContent?.trim() || ""
      );

      // extract product brand
      const brand = "Cotton On"; // hardcoded for this retailer

      // extract product category
      const category = await page.$eval(
        ".breadcrumb-item:nth-child(2)",
        (el) => el.textContent?.trim() || ""
      );

      // extract product subcategory
      const subcategory = await page.$eval(
        ".breadcrumb-item:nth-child(3)",
        (el) => el.textContent?.trim() || ""
      );

      // extract product colors
      const colors = await page.$$eval(".color-swatch", (swatches) =>
        swatches.map((swatch) => swatch.getAttribute("data-color") || "")
      );

      // extract product sizes
      const sizes = await page.$$eval(".size-swatch", (swatches) =>
        swatches.map((swatch) => swatch.textContent?.trim() || "")
      );

      // extract product gender
      let gender: "men" | "women" | "unisex" | undefined;
      if (category.toLowerCase().includes("men")) {
        gender = "men";
      } else if (category.toLowerCase().includes("women")) {
        gender = "women";
      } else {
        gender = "unisex";
      }

      // extract product image urls
      const imageUrls = await page.$$eval(".product-image img", (images) =>
        images.map((img) => img.getAttribute("src") || "")
      );

      // check if product is available
      const available = (await page.$(".out-of-stock")) === null;

      // extract product object
      const product: Product = {
        title,
        description,
        price,
        salePrice,
        currency: "AUD",
        brand,
        category,
        subcategory,
        colors: colors.filter(Boolean), // remove empty values
        sizes: sizes.filter(Boolean), // remove empty values
        gender,
        imageUrls: imageUrls.filter(Boolean), // remove empty values
        sourceUrl: page.url(),
        sourceSite: "Cotton On",
        available,
      };

      return product;
    } catch (error) {
      console.error(`Error extracting product data from ${page.url()}:`, error);
      throw error;
    }
  }

  /**
   * crawl a product page and extract data
   * @param url - product page url
   * @returns product data
   */
  async crawlProductPage(url: string): Promise<Product> {
    // navigate to the product page
    const page = await this.crawlPage(url);

    try {
      // extract product data
      const productData = await this.extractProductData(page);

      // close the page
      await page.close();

      return productData;
    } catch (error) {
      // close the page on error
      await page.close();
      throw error;
    }
  }

  /**
   * crawl a category page and extract product links
   * @params categoryUrl - category page url
   * @params maxProducts - maximum number of products to crawl
   * @returns array of product data
   */
  async crawlCategoryPage(
    categoryUrl: string,
    maxProducts?: number
  ): Promise<Product[]> {
    // navigate to the category page
    const page = await this.crawlPage(categoryUrl);

    try {
      // extract product links
      const productLinks = await page.$$eval(
        ".product-card a",
        (links) =>
          links
            .map((link) => link.getAttribute("href") || "")
            .filter(Boolean) as string[]
      );

      // limit the number of products
      const limitedLinks = productLinks.slice(0, maxProducts);

      // close the category page
      await page.close();

      // crawl each product page
      const products: Product[] = [];

      for (const link of limitedLinks) {
        try {
          // convert relative url to absolute url, if needed
          const absoluteUrl = new URL(link, categoryUrl).toString();

          // add delay between requests to avoid overloading the server
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // crawl the product page
          const product = await this.crawlProductPage(absoluteUrl);

          // add product to the list
          products.push(product);

          console.log(`Crawled product: ${product.title}`);
        } catch (error) {
          console.error(`Error crawling product ${link}:`, error);
        }
      }

      return products;
    } catch (error) {
      // close the page on error
      await page.close();
      throw error;
    }
  }
}
