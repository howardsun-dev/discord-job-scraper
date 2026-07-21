import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { describe, expect, it } from 'vitest';
import { LinkedInScraper } from './LinkedInScraper.js';

class TestLinkedInScraper extends LinkedInScraper {
  extract(html: string) {
    const $ = cheerio.load(html);
    return this.extractJobData($, $('.base-search-card').get(0) as AnyNode);
  }
}

describe('LinkedInScraper', () => {
  it('extracts a current LinkedIn guest result card', () => {
    const scraper = new TestLinkedInScraper();
    const job = scraper.extract(`
      <div class="base-search-card" data-entity-urn="urn:li:jobPosting:123">
        <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/123?trackingId=x"></a>
        <h3 class="base-search-card__title">Software Engineer</h3>
        <h4 class="base-search-card__subtitle">Example Co</h4>
        <span class="job-search-card__location">Remote</span>
        <time class="job-search-card__listdate" datetime="2026-07-18"></time>
      </div>
    `);

    expect(job).toMatchObject({
      title: 'Software Engineer',
      company: 'Example Co',
      location: 'Remote',
      url: 'https://www.linkedin.com/jobs/view/123',
      postedDate: new Date(2026, 6, 18),
    });
  });
});
