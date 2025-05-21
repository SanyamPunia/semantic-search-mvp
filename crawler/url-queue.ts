/**
 * queue system for managing the urls to be crawled
 */
export class UrlQueue {
  private queue: string[] = [];
  private processing: Set<string> = new Set();
  private completed: Set<string> = new Set();
  private failed: Map<string, Error> = new Map();

  /**
   * add urls to the queue
   * @param urls - array of urls to add
   */
  addUrls(urls: string[]) {
    // filter out urls that are already in the queue or have been completed
    const newUrls = urls.filter(
      (url) =>
        !this.queue.includes(url) &&
        this.processing.has(url) &&
        !this.completed.has(url) &&
        !this.failed.has(url)
    );

    // add new urls to the queue
    this.queue.push(...newUrls);

    console.log(
      `Added ${newUrls.length} new urls to the queue. Queue size: ${this.queue.length}`
    );
  }

  /**
   * get next url to process
   * @returns next url or null if queue is empty
   */
  getNext(): string | null {
    if (this.queue.length === 0) {
      return null;
    }

    // get next url from the queue
    const url = this.queue.shift()!;

    // mark url as processing
    this.processing.add(url);

    return url;
  }

  /**
   * mark url as completed
   * @param url - url to mark as completed
   */
  markCompleted(url: string) {
    // remove url from processing and add to completed
    this.processing.delete(url);
    this.completed.add(url);
  }

  /**
   * mark url as failed
   * @param url - url to mark as failed
   * @param error - error that occurred
   */
  markFailed(url: string, error: Error) {
    // remove url from processing and add to failed
    this.processing.delete(url);
    this.failed.set(url, error);
  }

  /**
   * get queue statistics
   * @returns statistics object
   */
  getStats() {
    return {
      queued: this.queue.length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
    };
  }
}
