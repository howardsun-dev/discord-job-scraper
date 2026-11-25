import { BaseScraper } from './BaseScraper.js';
import type { ScrapedJobData } from '../types/job.js';
import { randomDelay } from '../utils/helpers.js';

const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Base for sources that expose JSON/RSS feeds instead of HTML job cards.
 * The scheduler calls searchJobs once per keyword, so responses are cached briefly
 * to fetch each feed URL once per run instead of once per keyword.
 */
export abstract class FeedScraper extends BaseScraper {
  private cache = new Map<string, { at: number; data?: unknown; error?: unknown }>();

  constructor(rateLimitMs = 1000) {
    super({
      baseUrl: '',
      searchPath: '',
      selectors: { jobCard: '', title: '', company: '', location: '', description: '', url: '' },
      rateLimitMs,
    });
  }

  protected requiresBrowser(): boolean {
    return false;
  }

  protected extractJobData(): ScrapedJobData | null {
    return null;
  }

  protected async fetchCached<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
    const hit = this.cache.get(url);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      if (hit.error) throw hit.error; // don't re-hit a blocked feed for every keyword
      return hit.data as T;
    }

    await randomDelay(this.config.rateLimitMs, this.config.rateLimitMs * 2);
    try {
      const response = await this.axiosClient.get<T>(url, {
        headers: { 'User-Agent': 'discord-job-scraper/0.1', Accept: '*/*', ...headers },
      });
      this.cache.set(url, { at: Date.now(), data: response.data });
      return response.data;
    } catch (error) {
      this.cache.set(url, { at: Date.now(), error });
      throw error;
    }
  }
}
