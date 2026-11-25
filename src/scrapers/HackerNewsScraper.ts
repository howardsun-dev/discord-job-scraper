import { FeedScraper } from './FeedScraper.js';
import type { JobSource, ScrapedJobData } from '../types/job.js';
import { extractSalary, htmlToText, matchesKeywords } from '../utils/helpers.js';

const API = 'https://hn.algolia.com/api/v1';

export interface HnComment {
  objectID: string;
  parent_id: number | string;
  comment_text: string | null;
  created_at: string;
}

/** Latest monthly "Ask HN: Who is hiring?" thread; each top-level comment is one posting. */
export class HackerNewsScraper extends FeedScraper {
  getSource(): JobSource {
    return 'hackernews';
  }

  async searchJobs(keywords: string): Promise<ScrapedJobData[]> {
    const stories = await this.fetchCached<{ hits: { objectID: string; title: string }[] }>(
      `${API}/search_by_date?tags=story,author_whoishiring&hitsPerPage=5`,
    );
    const story = stories.hits.find((hit) => /who is hiring/i.test(hit.title));
    if (!story) return [];

    // shortcut: Algolia caps a page at 1000 hits, enough for one month's thread incl. replies.
    const comments = await this.fetchCached<{ hits: HnComment[] }>(
      `${API}/search?tags=comment,story_${story.objectID}&hitsPerPage=1000`,
    );
    return this.parse(comments.hits, story.objectID, keywords);
  }

  parse(comments: HnComment[], storyId: string, keywords: string): ScrapedJobData[] {
    return comments
      .filter((c) => String(c.parent_id) === storyId && c.comment_text)
      .map((c) => {
        const html = c.comment_text as string;
        // Convention: first line is "Company | Role | Location | ..."
        const header = htmlToText(html.split('<p>')[0]);
        const parts = header.split('|').map((p) => p.trim());
        return {
          title: header,
          company: parts[0] || 'Unknown',
          location: parts.find((p) => /remote|onsite|on-site|hybrid/i.test(p)) ?? '',
          description: htmlToText(html),
          url: `https://news.ycombinator.com/item?id=${c.objectID}`,
          salary: extractSalary(header),
          postedDate: new Date(c.created_at),
          source: this.getSource(),
        };
      })
      .filter((job) => matchesKeywords(job.description, keywords));
  }
}
