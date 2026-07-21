import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { describe, expect, it } from 'vitest';
import { IndeedScraper } from './IndeedScraper.js';

class TestIndeedScraper extends IndeedScraper {
  extract(html: string) {
    const $ = cheerio.load(html);
    return this.extractJobData($, $('.job_seen_beacon').get(0) as AnyNode);
  }
}

describe('IndeedScraper', () => {
  it('extracts a current Indeed result card', () => {
    const scraper = new TestIndeedScraper();
    const job = scraper.extract(`
      <div class="job_seen_beacon">
        <a data-jk="abc123" href="/viewjob?jk=abc123">Software Engineer</a>
        <span data-testid="company-name">Example Co</span>
        <div data-testid="text-location">Remote</div>
        <div class="job-snippet">Build TypeScript services</div>
        <li data-testid="attribute_snippet_testid salary-snippet-container">$120,000 / year</li>
        <span class="date">2 days ago</span>
      </div>
    `);

    expect(job).toMatchObject({
      title: 'Software Engineer',
      company: 'Example Co',
      location: 'Remote',
      description: 'Build TypeScript services',
      url: 'https://www.indeed.com/viewjob?jk=abc123',
      salary: '$120,000 / year',
    });
    expect(job?.postedDate).toBeInstanceOf(Date);
  });

  it('rejects cards without a stable Indeed job id', () => {
    const scraper = new TestIndeedScraper();
    expect(scraper.extract(`
      <div class="job_seen_beacon">
        <a href="/viewjob">Software Engineer</a>
        <span data-testid="company-name">Example Co</span>
      </div>
    `)).toBeNull();
  });
});
