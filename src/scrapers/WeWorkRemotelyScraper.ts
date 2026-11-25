import * as cheerio from 'cheerio';
import { FeedScraper } from './FeedScraper.js';
import type { JobSource, ScrapedJobData } from '../types/job.js';
import { cleanText, htmlToText, matchesKeywords } from '../utils/helpers.js';

export class WeWorkRemotelyScraper extends FeedScraper {
  getSource(): JobSource {
    return 'weworkremotely';
  }

  async searchJobs(keywords: string): Promise<ScrapedJobData[]> {
    return this.parse(await this.fetchCached<string>('https://weworkremotely.com/remote-jobs.rss'), keywords);
  }

  parse(rss: string, keywords: string): ScrapedJobData[] {
    const $ = cheerio.load(rss, { xml: true });
    return $('item')
      .toArray()
      .flatMap((item) => {
        const $item = $(item);
        // Titles look like "Company: Role"
        const [company, ...role] = cleanText($item.find('title').text()).split(': ');
        const title = role.join(': ') || company;
        const url = cleanText($item.find('link').text() || $item.find('guid').text());
        // Match title/category only: descriptions are long and mention most buzzwords.
        const tags = `${$item.find('category').text()} ${$item.find('skills').text()}`;
        if (!url || !matchesKeywords(`${title} ${tags}`, keywords)) return [];

        const region = cleanText($item.find('region').text());
        return [{
          title,
          company: role.length ? company : 'Unknown',
          location: region ? `Remote (${region})` : 'Remote',
          description: htmlToText($item.find('description').text()),
          url,
          postedDate: new Date($item.find('pubDate').text()),
          source: this.getSource(),
        }];
      });
  }
}
