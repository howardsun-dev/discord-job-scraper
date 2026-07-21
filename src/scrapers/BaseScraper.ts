import { Browser, launch } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios, { AxiosInstance } from 'axios';
import UserAgent from 'user-agents';
import { ScraperConfig, ScrapedJobData, JobSource, JobSearchFilters } from '../types/job.js';
import { generateExternalId, randomDelay } from '../utils/helpers.js';
import type { AnyNode } from 'domhandler';

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected axiosClient: AxiosInstance;
  protected config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
    this.axiosClient = axios.create({
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 30000,
    });
  }

  abstract getSource(): JobSource;

  abstract searchJobs(
    keywords: string,
    location: string,
    maxPages?: number,
    filters?: JobSearchFilters,
  ): Promise<ScrapedJobData[]>;

  async initialize(): Promise<void> {
    if (!this.requiresBrowser()) return;

    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    };
    this.browser = await launch(launchOptions);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async fetchWithPuppeteer(url: string): Promise<string> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    const page = await this.browser.newPage();
    await page.setUserAgent(new UserAgent({ deviceCategory: 'desktop' }).toString());
    await page.setViewport({ width: 1366, height: 768 });
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await randomDelay(this.config.rateLimitMs, this.config.rateLimitMs * 2);
      const content = await page.content();
      return content;
    } finally {
      await page.close();
    }
  }

  protected async fetchWithAxios(url: string): Promise<string> {
    try {
      await randomDelay(this.config.rateLimitMs, this.config.rateLimitMs * 2);
      const response = await this.axiosClient.get(url, {
        headers: { 'User-Agent': new UserAgent({ deviceCategory: 'desktop' }).toString() },
      });
      return response.data;
    } catch (error) {
      console.error(`[${this.getSource()}] Axios fetch failed for ${url}:`, error);
      throw error;
    }
  }

  protected parseWithCheerio(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  protected abstract extractJobData($: cheerio.CheerioAPI, element: AnyNode): ScrapedJobData | null;

  async scrape(searchUrl: string, maxPages = 1): Promise<ScrapedJobData[]> {
    const allJobs: ScrapedJobData[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const url = this.buildPageUrl(searchUrl, page);
      console.log(`[${this.getSource()}] Scraping page ${page}: ${url}`);

      try {
        let html: string;
        if (this.requiresBrowser()) {
          html = await this.fetchWithPuppeteer(url);
        } else {
          html = await this.fetchWithAxios(url);
        }

        const $ = this.parseWithCheerio(html);
        const jobElements = $(this.config.selectors.jobCard);

        if (jobElements.length === 0) {
          console.log(`[${this.getSource()}] No job cards found on page ${page}, stopping.`);
          break;
        }

        let pageJobCount = 0;
        jobElements.each((_, element) => {
          const jobData = this.extractJobData($, element);
          if (jobData) {
            jobData.source = this.getSource();
            allJobs.push(jobData);
            pageJobCount++;
          }
        });

        console.log(`[${this.getSource()}] Found ${pageJobCount} jobs on page ${page}`);

        if (pageJobCount === 0) {
          break;
        }
      } catch (error) {
        console.error(`[${this.getSource()}] Error scraping page ${page}:`, error);
        break;
      }
    }

    return allJobs;
  }

  protected buildPageUrl(baseUrl: string, page: number): string {
    if (this.config.pagination?.type === 'query') {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}${this.config.pagination.param}=${page}`;
    }
    if (this.config.pagination?.type === 'path') {
      return baseUrl.replace('{page}', page.toString());
    }
    return baseUrl;
  }

  protected requiresBrowser(): boolean {
    return true;
  }

  protected generateExternalId(url: string): string {
    return generateExternalId(url, this.getSource());
  }
}