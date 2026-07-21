import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { describe, expect, it } from 'vitest';
import { BaseScraper } from './BaseScraper.js';
import type { JobSource, ScrapedJobData, ScraperConfig } from '../types/job.js';

const TEST_CONFIG: ScraperConfig = {
  baseUrl: 'https://example.com',
  searchPath: '/jobs',
  selectors: {
    jobCard: '.job',
    title: '.title',
    company: '.company',
    location: '.location',
    description: '.description',
    url: 'a',
  },
  rateLimitMs: 0,
};

class HtmlScraper extends BaseScraper {
  constructor(private readonly html: string) {
    super(TEST_CONFIG);
  }

  getSource(): JobSource {
    return 'indeed';
  }

  searchJobs(): Promise<ScrapedJobData[]> {
    return this.scrape('https://example.com/jobs');
  }

  protected requiresBrowser(): boolean {
    return false;
  }

  protected async fetchWithAxios(): Promise<string> {
    return this.html;
  }

  protected extractJobData($: cheerio.CheerioAPI, element: AnyNode): ScrapedJobData | null {
    const card = $(element);
    return {
      title: card.find('.title').text(),
      company: card.find('.company').text(),
      location: card.find('.location').text(),
      description: card.find('.description').text(),
      url: card.find('a').attr('href') || '',
    };
  }
}

describe('BaseScraper', () => {
  it('surfaces anti-bot challenge pages as failures', async () => {
    const scraper = new HtmlScraper('<html><title>Humans only</title><div class="cf-chl-widget"></div></html>');
    await expect(scraper.searchJobs()).rejects.toThrow('Anti-bot challenge received');
  });

  it('still returns an honest empty result for a normal page without jobs', async () => {
    const scraper = new HtmlScraper('<html><title>No matching jobs</title></html>');
    await expect(scraper.searchJobs()).resolves.toEqual([]);
  });
});
