import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { BaseScraper } from './BaseScraper.js';
import { ScraperConfig, ScrapedJobData, JobSource } from '../types/job.js';
import { buildSearchUrl, cleanText, isRemote, parsePostedDate, resolveJobUrl } from '../utils/helpers.js';

const BUILTIN_CONFIG: ScraperConfig = {
  baseUrl: 'https://builtin.com',
  searchPath: '/jobs',
  selectors: {
    jobCard: '[data-id="job-card"]',
    title: '[data-id="job-card-title"]',
    company: '[data-id="company-title"]',
    location: '.fa-location-dot',
    description: '.fa-house-building',
    url: '[data-id="job-card-title"]',
    salary: '.fa-sack-dollar',
    postedDate: '.fa-clock',
  },
  pagination: { type: 'query', param: 'page', maxPages: 5 },
  rateLimitMs: 2000,
};

export class BuiltInScraper extends BaseScraper {
  constructor() {
    super(BUILTIN_CONFIG);
  }

  getSource(): JobSource {
    return 'builtin';
  }

  protected requiresBrowser(): boolean {
    return false; // server-rendered HTML
  }

  protected extractJobData($: cheerio.CheerioAPI, element: AnyNode): ScrapedJobData | null {
    const $el = $(element);
    const { selectors } = this.config;
    // Attributes are rendered as "<icon/> <span>value</span>" pairs; read the span beside each icon.
    const besideIcon = (icon: string) =>
      cleanText($el.find(icon).first().parent().parent().find('span').first().text());

    const titleEl = $el.find(selectors.title).first();
    const title = cleanText(titleEl.text());
    const company = cleanText($el.find(selectors.company).first().text());
    const url = resolveJobUrl(titleEl.attr('href'), this.config.baseUrl);
    if (!title || !company || !url) return null;

    const workplace = besideIcon(selectors.description); // e.g. "Remote or Hybrid"
    const place = besideIcon(selectors.location);
    const posted = cleanText($el.find(selectors.postedDate as string).first().parent().text());

    return {
      title,
      company,
      location: [workplace, place].filter(Boolean).join(' · '),
      description: cleanText($el.text()),
      url,
      salary: besideIcon(selectors.salary as string) || undefined,
      postedDate: posted ? parsePostedDate(posted) : null,
    };
  }

  async searchJobs(keywords: string, location: string, maxPages = 2): Promise<ScrapedJobData[]> {
    // shortcut: only "remote" vs everywhere; Built In's city filters use per-city paths we don't map yet.
    const path = isRemote(location) ? '/jobs/remote' : this.config.searchPath;
    return this.scrape(buildSearchUrl(this.config.baseUrl, path, { search: keywords }), maxPages);
  }
}
