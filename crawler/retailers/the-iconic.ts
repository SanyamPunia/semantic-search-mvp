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
    async extractProductData(page: Page): Promise<Product> {
        await page.waitForSelector('[data-testid="pdp-title"]', { timeout: 5000 });

        try {
            // extract product title
            const title = await page.$eval('[data-testid="pdp-title"]', (el) => el.textContent?.trim() || "");

            // extract product price 
            const price = await page.$eval('[data-testid="price"]', (el) => {
                const priceText = el.textContent?.trim() || ""

                // remove currency symbol and convert to number
                return parseFloat(priceText.replace(/[^0-9.-]/g, ""));
            })

            // extract sale price if available
            let salePrice: number | undefined;
            try {
                const hasSalePrice = await page.$('[data-testid="sale-price"]') !== null
                if (hasSalePrice) {
                    salePrice = await page.$eval('[data-testid="sale-price"]', (el) => {
                        const priceText = el.textContent?.trim() || ""
                        return parseFloat(priceText.replace(/[^0-9.-]/g, ""));
                    })
                }
            } catch (error) {
                // no sale price
            }

            // extract product description
            const description = await page.$eval('[data-testid="pdp-description"]', (el) => el.textContent?.trim() || "");

            // extract product brand
            const brand = await page.$eval('[data-testid="pdp-brand"]', (el) => el.textContent?.trim() || "")

            // extract product category from breadcrumbs
            const category = await page.$eval('.breadcrumbs li:nth-child(2)', (el) => el.textContent?.trim() || '');

            // extract product subcategory from breadcrumbs
            const subcategory = await page.$eval('.breadcrumbs li:nth-child(3)', (el) => el.textContent?.trim() || '');

            // extract product colors
            const colors = await page.$$eval('[data-testid="color-option"]', (options) =>
                options.map(option => option.getAttribute('aria-label')?.replace('Color: ', '') || '')
            );

            // extract product sizes
            const sizes = await page.$$eval('[data-testid="size-option"]', (options) =>
                options.map(option => option.textContent?.trim() || '')
            );

            // extract product gender
            let gender: 'men' | 'women' | 'unisex' | undefined;
            if (page.url().includes('/men/')) {
                gender = 'men';
            } else if (page.url().includes('/women/')) {
                gender = 'women';
            } else {
                gender = 'unisex';
            }

            // extract product image URLs
            const imageUrls = await page.$$eval('[data-testid="pdp-gallery"] img', (images) =>
                images.map(img => img.getAttribute('src') || '')
            );

            // check if product is available
            const available = await page.$('[data-testid="add-to-cart"]') !== null;

            // create product object
            const product: Product = {
                title,
                description,
                price,
                salePrice,
                currency: "AUD",
                brand,
                category,
                subcategory,
                colors: colors.filter(Boolean),
                sizes: sizes.filter(Boolean),
                gender,
                imageUrls: imageUrls.filter(Boolean),
                sourceUrl: page.url(),
                sourceSite: "The Iconic",
                available,
            }

            return product;
        } catch (error) {
            console.error(`Error extracting product data from ${page.url()}:`, error)
            throw error;
        }
    }

    /**
     * crawl a product page and extract data
     * @param url - url of the product page
     * @returns product data
     */
    async crawlProductPage(url: string): Promise<Product> {
        // navigate to product page
        const page = await this.crawlPage(url)

        try {
            // extract product data
            const productData = await this.extractProductData(page);

            // close the page
            await page.close()

            return productData;
        } catch (error) {
            // close the page on error
            await page.close()
            throw error;
        }
    }

    /**
     * crawl a category page and extract product links
     * @param categoryUrl - url of the category page
     * @param maxProducts - maximum number of products to crawl
     * @returns array of product data
     */
    async crawlCategoryPage(categoryUrl: string, maxProducts = 20): Promise<Product[]> {
        // navigate to category page
        const page = await this.crawlPage(categoryUrl)

        try {
            // scroll down to load more products (the iconic uses lazy loading)
            await this.scrollToLoadMore(page);

            // extract product links
            const productLinks = await page.$$eval('[data-testid="product-card] a', (links) =>
                links.map(link => link.getAttribute('href')).filter(Boolean) as string[]
            )

            // limit the number of products
            const limitedLinks = productLinks.slice(0, maxProducts);

            // close the category page
            await page.close()

            // crawl each product page
            const products: Product[] = [];

            for (const link of limitedLinks) {
                try {
                    // convert relative url to absolute, if needed
                    const absoluteUrl = new URL(link, categoryUrl).toString()

                    // add delay between requests to avoid overloading the server
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // crawl the product page
                    const product = await this.crawlProductPage(absoluteUrl)

                    // add product to the list
                    products.push(product)

                    console.log(`Crawled product: ${product.title}`)
                } catch (error) {
                    console.error(`Error crawling product ${link}:`, error)
                }
            }

            return products;
        } catch (error) {
            // close the category page on error
            await page.close()
            throw error;
        }
    }

    /**
     * scroll down to load more products
     * @param page - playwright page object
     * @returns void
     */
    private async scrollToLoadMore(page: Page) {
        // scroll down multiple times to trigger lazy loading
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });

            // wait for new content to load
            await page.waitForTimeout(1000)
        }
    }
}