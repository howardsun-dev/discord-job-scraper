import { BaseScraper } from './BaseScraper.js';
import { ScraperConfig, ScrapedJobData, JobSource } from '../types/job.js';
import { cleanText, extractSalary, parsePostedDate, buildSearchUrl } from '../utils/helpers.js';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

const GLASSDOOR_CONFIG: ScraperConfig = {
  baseUrl: 'https://www.glassdoor.com',
  searchPath: '/Job/jobs.htm',
  selectors: {
    jobCard: '[data-test="job-listing"]',
    title: '[data-test="job-title"]',
    company: '[data-test="employer-name"]',
    location: '[data-test="job-location"]',
    description: '[data-test="job-description-snippet"]',
    url: 'a[data-test="job-title"]',
    salary: '[data-test="salary-estimate"]',
    postedDate: '[data-test="job-age"]',
  },
  pagination: {
    type: 'query',
    param: 'p',
    maxPages: 5,
  },
  rateLimitMs: 4000,
};

export class GlassdoorScraper extends BaseScraper {
  getSource(): JobSource {
    return 'glassdoor';
  }

  constructor() {
    super(GLASSDOOR_CONFIG);
  }

  protected buildPageUrl(baseUrl: string, page: number): string {
    if (page === 1) return baseUrl;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}p=${page}`;
  }

  protected requiresBrowser(): boolean {
    return true;
  }

  protected extractJobData($: cheerio.CheerioAPI, element: AnyNode): ScrapedJobData | null {
    const $el = $(element);
    const jobId = $el.attr('data-job-id') || $el.attr('data-id');
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
    let url = urlEl.attr('href') || '';
    if (url && !url.startsWith('http')) {
      url = `https://www.glassdoor.com${url}`;
    }
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
      sc: 'keyword',
      locT: 'C',
      locId: '',
      jobType: '',
      fromAge: '7', // Past week
      keyword: keywords,
      location: location,
    });
    return this.scrape(searchUrl, maxPages);
  }
}