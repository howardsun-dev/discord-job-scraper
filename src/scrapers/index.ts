import { IndeedScraper } from './IndeedScraper.js';
import { LinkedInScraper } from './LinkedInScraper.js';
import { GlassdoorScraper } from './GlassdoorScraper.js';
import { BaseScraper } from './BaseScraper.js';
import { JobSource, ScrapedJobData, JobSearchFilters } from '../types/job.js';

const DEFAULT_SCRAPER_SOURCES: JobSource[] = ['indeed', 'linkedin', 'glassdoor'];

export class ScraperManager {
  private scrapers: Map<JobSource, BaseScraper> = new Map();
  private initialized = false;
  private operationTail: Promise<void> = Promise.resolve();

  constructor() {
    this.scrapers.set('indeed', new IndeedScraper());
    this.scrapers.set('linkedin', new LinkedInScraper());
    this.scrapers.set('glassdoor', new GlassdoorScraper());
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    for (const [source, scraper] of this.scrapers) {
      try {
        await scraper.initialize();
        console.log(`✅ ${source} scraper initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${source} scraper:`, error);
      }
    }
    this.initialized = true;
  }

  async close(): Promise<void> {
    for (const [source, scraper] of this.scrapers) {
      try {
        await scraper.close();
        console.log(`✅ ${source} scraper closed`);
      } catch (error) {
        console.error(`❌ Error closing ${source} scraper:`, error);
      }
    }
    this.initialized = false;
  }

  getScraper(source: JobSource): BaseScraper | undefined {
    return this.scrapers.get(source);
  }

  getAllScrapers(): BaseScraper[] {
    return Array.from(this.scrapers.values());
  }

  async runExclusive<T>(operation: (manager: ScraperManager) => Promise<T>): Promise<T> {
    const previousOperation = this.operationTail;
    let release!: () => void;
    this.operationTail = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previousOperation;
    try {
      await this.initialize();
      return await operation(this);
    } finally {
      try {
        await this.close();
      } finally {
        release();
      }
    }
  }

  async scrapeAllSources(
    keywords: string,
    location: string,
    filters: JobSearchFilters = {},
    maxPages = 2
  ): Promise<ScrapedJobData[]> {
    const sources = filters.sources || DEFAULT_SCRAPER_SOURCES;
    const allJobs: ScrapedJobData[] = [];
    const failures: Error[] = [];

    for (const source of sources) {
      const scraper = this.scrapers.get(source);
      if (!scraper) {
        console.warn(`Scraper for ${source} not found`);
        continue;
      }

      try {
        console.log(`🔍 Scraping ${source} for "${keywords}" in "${location}"...`);
        const jobs = await scraper.searchJobs(keywords, location, maxPages, filters);
        console.log(`✅ ${source}: Found ${jobs.length} jobs`);
        allJobs.push(...jobs);
      } catch (error) {
        console.error(`❌ Error scraping ${source}:`, error);
        failures.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    if (allJobs.length === 0 && failures.length > 0) {
      throw new AggregateError(failures, 'All requested scraper sources failed');
    }

    return allJobs;
  }
}

export const scraperManager = new ScraperManager();