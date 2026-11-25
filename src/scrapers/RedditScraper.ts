import { FeedScraper } from './FeedScraper.js';
import type { JobSource, ScrapedJobData } from '../types/job.js';
import { cleanText, extractSalary, matchesKeywords } from '../utils/helpers.js';

const DEFAULT_SUBREDDITS = 'sysadminjobs,devopsjobs,remotejs,RemoteJobs,forhire,jobbit';
const HIRING = /\bhiring\b/i;
const FOR_HIRE = /for[\s-]?hire/i;

interface RedditPost {
  title: string;
  selftext: string;
  permalink: string;
  subreddit: string;
  created_utc: number;
  link_flair_text?: string | null;
  stickied?: boolean;
}

export interface RedditListing {
  data: { children: { data: RedditPost }[] };
}

export class RedditScraper extends FeedScraper {
  private token: { value: string; expiresAt: number } | null = null;

  getSource(): JobSource {
    return 'reddit';
  }

  async searchJobs(keywords: string): Promise<ScrapedJobData[]> {
    // One request covers every subreddit: /r/a+b+c/new
    const subs = (process.env.REDDIT_SUBREDDITS || DEFAULT_SUBREDDITS)
      .split(',').map((s) => s.trim()).filter(Boolean).join('+');
    return this.parse(await this.fetchListing(subs), keywords);
  }

  parse(listing: RedditListing, keywords: string): ScrapedJobData[] {
    return listing.data.children
      .map((child) => child.data)
      .filter((post) => {
        const tag = `${post.title} ${post.link_flair_text ?? ''}`;
        return !post.stickied && HIRING.test(tag) && !FOR_HIRE.test(tag);
      })
      .filter((post) => matchesKeywords(`${post.title} ${post.selftext}`, keywords))
      .map((post) => ({
        title: cleanText(post.title),
        company: `r/${post.subreddit}`,
        location: /remote/i.test(post.title) ? 'Remote' : '',
        description: cleanText(post.selftext),
        url: `https://www.reddit.com${post.permalink}`,
        salary: extractSalary(`${post.title} ${post.selftext}`),
        postedDate: new Date(post.created_utc * 1000),
        source: this.getSource(),
      }));
  }

  private async fetchListing(subs: string): Promise<RedditListing> {
    const userAgent = process.env.REDDIT_USER_AGENT || 'discord-job-scraper/0.1';
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      // Unauthenticated feed: Reddit rejects this from many networks (403 "blocked by network security").
      return this.fetchCached(`https://www.reddit.com/r/${subs}/new.json?limit=100&raw_json=1`, {
        'User-Agent': userAgent,
      });
    }

    const token = await this.getToken(clientId, clientSecret, userAgent);
    return this.fetchCached(`https://oauth.reddit.com/r/${subs}/new?limit=100&raw_json=1`, {
      'User-Agent': userAgent,
      Authorization: `Bearer ${token}`,
    });
  }

  private async getToken(clientId: string, clientSecret: string, userAgent: string): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) return this.token.value;

    const response = await this.axiosClient.post<{ access_token: string; expires_in: number }>(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      { auth: { username: clientId, password: clientSecret }, headers: { 'User-Agent': userAgent } },
    );
    this.token = {
      value: response.data.access_token,
      expiresAt: Date.now() + (response.data.expires_in - 60) * 1000,
    };
    return this.token.value;
  }
}
