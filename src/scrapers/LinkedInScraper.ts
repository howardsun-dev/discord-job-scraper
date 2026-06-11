import { BaseScraper } from './BaseScraper.js';
import { ScraperConfig, ScrapedJobData, JobSource } from '../types/job.js';
import { cleanText, extractSalary, parsePostedDate, buildSearchUrl } from '../utils/helpers.js';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

const LINKEDIN_CONFIG: ScraperConfig = {
  baseUrl: 'https://www.linkedin.com',
  searchPath: '/jobs/search',
  selectors: {
    jobCard: '[data-job-id]',
    title: '.base-search-card__title',
    company: '.base-search-card__subtitle',
    location: '.job-search-card__location',
    description: '.job-search-card__snippet',
    url: 'a.base-card__full-link',
    salary: '.job-search-card__salary-info',
    postedDate: '.job-search-card__listdate',
  },
  pagination: {
    type: 'query',
    param: 'start',
    maxPages: 5,
  },
  rateLimitMs: 5000,
};

export class LinkedInScraper extends BaseScraper {
  getSource(): JobSource {
    return 'linkedin';
  }

  constructor() {
    super(LINKEDIN_CONFIG);
  }

  protected buildPageUrl(baseUrl: string, page: number): string {
    if (page === 1) return baseUrl;
    const start = (page - 1) * 25;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}start=${start}`;
  }

  protected requiresBrowser(): boolean {
    return true;
  }

  protected extractJobData($: cheerio.CheerioAPI, element: AnyNode): ScrapedJobData | null {
    const $el = $(element);
    const jobId = $el.attr('data-job-id');
    if (!jobId) return null;

    const titleEl = $el.find(this.config.selectors.title);
    const companyEl = $el.find(this.config.selectors.company);
    const locationEl = $el.find(this.config.selectors.location);
    const descEl = $el.find(this.config.selectors.description);
    const urlEl = $el.find(this.config.selectors.url);
    const salaryEl = $el.find(this.config.selectors.salary);
    const dateEl = $el.find(this.config.selectors.postedDate);

    const title = cleanText(titleEl.text());
    const company = cleanText(companyEl.text());
    const location = cleanText(locationEl.text());
    const description = cleanText(descEl.text());
    const url = urlEl.attr('href') ? urlEl.attr('href')!.split('?')[0] : '';
    const salary = salaryEl.length ? cleanText(salaryEl.text()) : extractSalary($el.text());
    const postedDate = dateEl.length ? parsePostedDate(dateEl.attr('datetime') || dateEl.text()) : null;

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
      keywords,
      location,
      f_TPR: 'r604800', // Past week
      f_WT: '2', // Remote
    });
    return this.scrape(searchUrl, maxPages);
  }
}