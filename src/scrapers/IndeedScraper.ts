import { BaseScraper } from './BaseScraper.js';
import { ScraperConfig, ScrapedJobData, JobSource } from '../types/job.js';
import { cleanText, extractSalary, parsePostedDate, buildSearchUrl, resolveJobUrl } from '../utils/helpers.js';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

const INDEED_CONFIG: ScraperConfig = {
  baseUrl: 'https://www.indeed.com',
  searchPath: '/jobs',
  selectors: {
    jobCard: '.job_seen_beacon',
    title: 'a[data-jk]',
    company: '[data-testid="company-name"]',
    location: '[data-testid="text-location"]',
    description: '.job-snippet, [data-testid="job-snippet"]',
    url: 'a[data-jk]',
    salary: '[data-testid*="salary-snippet-container"]',
    postedDate: '.date, [data-testid="job-age"]',
  },
  pagination: {
    type: 'query',
    param: 'start',
    maxPages: 5,
  },
  rateLimitMs: 3000,
};

export class IndeedScraper extends BaseScraper {
  getSource(): JobSource {
    return 'indeed';
  }

  constructor() {
    super(INDEED_CONFIG);
  }

  protected buildPageUrl(baseUrl: string, page: number): string {
    if (page === 1) return baseUrl;
    const start = (page - 1) * 10;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}start=${start}`;
  }

  protected requiresBrowser(): boolean {
    return true;
  }

  protected extractJobData($: cheerio.CheerioAPI, element: AnyNode): ScrapedJobData | null {
    const $el = $(element);
    const titleEl = $el.find(this.config.selectors.title);
    const companyEl = $el.find(this.config.selectors.company);
    const locationEl = $el.find(this.config.selectors.location);
    const descEl = $el.find(this.config.selectors.description);
    const urlEl = $el.find(this.config.selectors.url);
    const salaryEl = $el.find(this.config.selectors.salary);
    const dateEl = $el.find(this.config.selectors.postedDate);
    const jobId = titleEl.attr('data-jk');
    if (!jobId) return null;

    const title = cleanText(titleEl.text());
    const company = cleanText(companyEl.text());
    const location = cleanText(locationEl.text());
    const description = cleanText(descEl.text()) || cleanText($el.text());
    const url = resolveJobUrl(urlEl.attr('href'), this.config.baseUrl);
    const salary = salaryEl.length ? cleanText(salaryEl.text()) : extractSalary($el.text());
    const postedDate = dateEl.length ? parsePostedDate(dateEl.text()) : null;

    if (!title || !company || !url) return null;

    return {
      title,
      company,
      location,
      description,
      url,
      salary,
      postedDate,
    };
  }

  async searchJobs(keywords: string, location: string, maxPages = 3): Promise<ScrapedJobData[]> {
    const searchUrl = buildSearchUrl(this.config.baseUrl, this.config.searchPath, {
      q: keywords,
      l: location,
    });
    return this.scrape(searchUrl, maxPages);
  }
}