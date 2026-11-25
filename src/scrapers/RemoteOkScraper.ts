import { FeedScraper } from './FeedScraper.js';
import type { JobSource, ScrapedJobData } from '../types/job.js';
import { htmlToText, matchesKeywords } from '../utils/helpers.js';

export interface RemoteOkJob {
  id?: string;
  position?: string;
  company?: string;
  location?: string;
  description?: string;
  tags?: string[];
  url?: string;
  salary_min?: number;
  salary_max?: number;
  date?: string;
}

/** RemoteOK API terms require linking back to the remoteok.com job URL, which we store as the job url. */
export class RemoteOkScraper extends FeedScraper {
  getSource(): JobSource {
    return 'remoteok';
  }

  async searchJobs(keywords: string): Promise<ScrapedJobData[]> {
    return this.parse(await this.fetchCached<RemoteOkJob[]>('https://remoteok.com/api'), keywords);
  }

  parse(items: RemoteOkJob[], keywords: string): ScrapedJobData[] {
    return items
      .filter((j) => j.id && j.position && j.url) // first element is the legal notice
      .filter((j) => matchesKeywords(`${j.position} ${(j.tags || []).join(' ')}`, keywords))
      .map((j) => ({
        title: j.position as string,
        company: j.company || 'Unknown',
        location: j.location || 'Remote',
        description: htmlToText(j.description || ''),
        url: j.url as string,
        salary: j.salary_min ? (j.salary_max ? `$${j.salary_min} - $${j.salary_max}` : `$${j.salary_min}+`) : undefined,
        postedDate: j.date ? new Date(j.date) : null,
        source: this.getSource(),
      }));
  }
}
