import { FeedScraper } from './FeedScraper.js';
import type { JobSource, ScrapedJobData } from '../types/job.js';
import { htmlToText, matchesKeywords } from '../utils/helpers.js';

export interface RemotiveJob {
  url: string;
  title: string;
  company_name: string;
  candidate_required_location: string;
  description: string;
  salary: string;
  publication_date: string;
  tags: string[];
  category: string;
}

export class RemotiveScraper extends FeedScraper {
  getSource(): JobSource {
    return 'remotive';
  }

  async searchJobs(keywords: string): Promise<ScrapedJobData[]> {
    // Remotive asks clients to poll sparingly, so fetch the feed once per run and filter locally.
    const feed = await this.fetchCached<{ jobs: RemotiveJob[] }>('https://remotive.com/api/remote-jobs');
    return this.parse(feed.jobs, keywords);
  }

  parse(jobs: RemotiveJob[], keywords: string): ScrapedJobData[] {
    return jobs
      .filter((j) => matchesKeywords(`${j.title} ${j.category} ${j.tags.join(' ')}`, keywords))
      .map((j) => ({
        title: j.title,
        company: j.company_name,
        location: `Remote (${j.candidate_required_location || 'Anywhere'})`,
        description: htmlToText(j.description),
        url: j.url,
        salary: j.salary || undefined,
        postedDate: new Date(j.publication_date),
        source: this.getSource(),
      }));
  }
}
