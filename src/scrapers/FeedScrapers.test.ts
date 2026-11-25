import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RedditScraper } from './RedditScraper.js';
import { HackerNewsScraper } from './HackerNewsScraper.js';
import { RemoteOkScraper } from './RemoteOkScraper.js';
import { RemotiveScraper } from './RemotiveScraper.js';
import { WeWorkRemotelyScraper } from './WeWorkRemotelyScraper.js';
import { BuiltInScraper } from './BuiltInScraper.js';
import { matchesKeywords } from '../utils/helpers.js';

const post = (title: string, extra: object = {}) => ({
  data: {
    title,
    selftext: 'Linux, Ansible, $90,000 / year',
    permalink: `/r/sysadminjobs/comments/${title.length}/x/`,
    subreddit: 'sysadminjobs',
    created_utc: 1_790_000_000,
    ...extra,
  },
});

describe('matchesKeywords', () => {
  it('matches any comma-separated phrase case-insensitively', () => {
    expect(matchesKeywords('Senior DevOps Engineer', 'sre, devops')).toBe(true);
    expect(matchesKeywords('Accountant', 'sre, devops')).toBe(false);
    expect(matchesKeywords('anything', '')).toBe(true);
  });
});

describe('RedditScraper', () => {
  it('keeps only [Hiring] posts that match keywords', () => {
    const jobs = new RedditScraper().parse(
      {
        data: {
          children: [
            post('[Hiring] Remote Linux Sysadmin'),
            post('[For Hire] Linux Sysadmin, 10 yrs'),
            post('[Hiring] Accountant', { selftext: 'Excel' }),
            post('Weekly hiring thread', { stickied: true }),
            post('Linux Admin needed', { link_flair_text: 'Hiring' }),
          ],
        },
      },
      'linux',
    );
    expect(jobs.map((j) => j.title)).toEqual(['[Hiring] Remote Linux Sysadmin', 'Linux Admin needed']);
    expect(jobs[0]).toMatchObject({
      company: 'r/sysadminjobs',
      location: 'Remote',
      source: 'reddit',
      url: 'https://www.reddit.com/r/sysadminjobs/comments/30/x/',
      salary: '$90,000 / year',
    });
  });
});

describe('HackerNewsScraper', () => {
  it('parses top-level "Company | Role | Location" comments only', () => {
    const jobs = new HackerNewsScraper().parse(
      [
        { objectID: '1', parent_id: 99, created_at: '2026-11-02T00:00:00Z', comment_text: 'Acme | DevOps Engineer | REMOTE (US)<p>We run k8s.' },
        { objectID: '2', parent_id: 1, created_at: '2026-11-02T00:00:00Z', comment_text: 'Is devops remote ok?' },
        { objectID: '3', parent_id: 99, created_at: '2026-11-02T00:00:00Z', comment_text: 'Foo | Designer | Onsite' },
      ],
      '99',
      'devops',
    );
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      title: 'Acme | DevOps Engineer | REMOTE (US)',
      company: 'Acme',
      location: 'REMOTE (US)',
      url: 'https://news.ycombinator.com/item?id=1',
      source: 'hackernews',
    });
  });
});

describe('RemoteOkScraper', () => {
  it('skips the legal notice and matches on tags', () => {
    const jobs = new RemoteOkScraper().parse(
      [
        { legal: 'terms' } as never,
        { id: '1', position: 'Platform Engineer', company: 'Co', tags: ['devops'], url: 'https://remoteok.com/1', salary_min: 100000, salary_max: 150000, date: '2026-11-24T00:00:00Z', description: '<p>Hi</p>' },
        { id: '2', position: 'Designer', company: 'Co', tags: ['figma'], url: 'https://remoteok.com/2' },
      ],
      'devops',
    );
    expect(jobs).toEqual([
      expect.objectContaining({ title: 'Platform Engineer', location: 'Remote', salary: '$100000 - $150000', description: 'Hi', source: 'remoteok' }),
    ]);
    expect(jobs[0]).not.toHaveProperty('tags');
  });
});

describe('RemotiveScraper', () => {
  it('maps the feed and filters by keyword', () => {
    const base = { company_name: 'Co', candidate_required_location: 'USA', description: '<b>k8s</b>', salary: '', publication_date: '2026-11-24T10:00:00', category: 'DevOps', tags: ['k8s'] };
    const jobs = new RemotiveScraper().parse(
      [{ ...base, title: 'SRE', url: 'https://remotive.com/1' }, { ...base, title: 'Sales', url: 'https://remotive.com/2', category: 'Sales', tags: [], description: 'k8s deals' }],
      'k8s',
    );
    expect(jobs).toEqual([expect.objectContaining({ title: 'SRE', location: 'Remote (USA)', salary: undefined, source: 'remotive' })]);
  });
});

describe('WeWorkRemotelyScraper', () => {
  it('splits "Company: Role" RSS titles', () => {
    const jobs = new WeWorkRemotelyScraper().parse(
      `<rss><channel>
        <item><title>GitLab: Site Reliability Engineer</title><region>Anywhere in the World</region>
          <category>DevOps and Sysadmin</category><description>&lt;p&gt;Kubernetes&lt;/p&gt;</description>
          <link>https://weworkremotely.com/remote-jobs/gitlab-sre</link><pubDate>Wed, 25 Nov 2026 22:40:10 +0000</pubDate></item>
        <item><title>Acme: Designer</title><description>Figma and Kubernetes</description><link>https://weworkremotely.com/x</link><pubDate>Wed, 25 Nov 2026 22:40:10 +0000</pubDate></item>
      </channel></rss>`,
      'devops',
    );
    expect(jobs).toEqual([
      expect.objectContaining({
        title: 'Site Reliability Engineer',
        company: 'GitLab',
        location: 'Remote (Anywhere in the World)',
        description: 'Kubernetes',
        url: 'https://weworkremotely.com/remote-jobs/gitlab-sre',
      }),
    ]);
  });
});

class TestBuiltIn extends BuiltInScraper {
  extract(html: string) {
    const $ = cheerio.load(html);
    return this.extractJobData($, $('[data-id="job-card"]').get(0) as AnyNode);
  }
}

describe('BuiltInScraper', () => {
  it('extracts a Built In job card', () => {
    // Trimmed from a live builtin.com/jobs/remote card (2026-11).
    const job = new TestBuiltIn().extract(`
      <div data-id="job-card">
        <a data-id="company-title" href="/company/datadog"><span>Datadog</span></a>
        <h2><a data-id="job-card-title" href="/job/certification-program-lead/12476752">Certification Program Lead</a></h2>
        <span class="fs-xs"><i class="fa-regular fa-clock"></i>5 Hours Ago</span>
        <div class="d-flex"><div class="d-flex"><i class="fa-regular fa-house-building"></i></div> <span>Remote or Hybrid</span></div>
        <div class="d-flex"><div class="d-flex"><i class="fa-regular fa-location-dot"></i></div> <div><span>4 Locations</span></div></div>
        <div class="d-flex"><div class="d-flex"><i class="fa-regular fa-sack-dollar"></i></div> <span>255K-315K Annually</span></div>
      </div>`);
    expect(job).toMatchObject({
      title: 'Certification Program Lead',
      company: 'Datadog',
      location: 'Remote or Hybrid · 4 Locations',
      url: 'https://builtin.com/job/certification-program-lead/12476752',
      salary: '255K-315K Annually',
    });
    expect(job?.postedDate).toBeInstanceOf(Date);
  });
});

describe('matchesKeywords whole words', () => {
  it('does not match inside longer words but handles symbols', () => {
    expect(matchesKeywords('Senior JavaScript Developer', 'java')).toBe(false);
    expect(matchesKeywords('Java Developer', 'java')).toBe(true);
    expect(matchesKeywords('C++ engineer', 'c++')).toBe(true);
    expect(matchesKeywords('Node.js backend', 'node.js')).toBe(true);
  });
});

describe('RemoteOkScraper salary', () => {
  it('shows an open-ended salary when only a minimum is given', () => {
    const [job] = new RemoteOkScraper().parse(
      [{ id: '1', position: 'SRE', url: 'https://remoteok.com/1', salary_min: 80000, salary_max: 0 }],
      'sre',
    );
    expect(job.salary).toBe('$80000+');
  });
});

type FakeHttp = { axiosClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }; config: { rateLimitMs: number } };
const fake = (scraper: RedditScraper) => {
  const s = scraper as unknown as FakeHttp;
  s.config.rateLimitMs = 0;
  s.axiosClient = { get: vi.fn(), post: vi.fn() };
  return s.axiosClient;
};

describe('RedditScraper HTTP', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses an app-only OAuth token when credentials are set', async () => {
    vi.stubEnv('REDDIT_CLIENT_ID', 'id');
    vi.stubEnv('REDDIT_CLIENT_SECRET', 'secret');
    vi.stubEnv('REDDIT_SUBREDDITS', 'sysadminjobs, devopsjobs');
    const scraper = new RedditScraper();
    const http = fake(scraper);
    http.post.mockResolvedValue({ data: { access_token: 'tok', expires_in: 3600 } });
    http.get.mockResolvedValue({ data: { data: { children: [post('[Hiring] Linux admin')] } } });

    expect(await scraper.searchJobs('linux')).toHaveLength(1);
    expect(await scraper.searchJobs('linux')).toHaveLength(1);

    expect(http.post).toHaveBeenCalledTimes(1); // token reused
    expect(http.post.mock.calls[0][0]).toBe('https://www.reddit.com/api/v1/access_token');
    expect(http.post.mock.calls[0][2].auth).toEqual({ username: 'id', password: 'secret' });
    expect(http.get).toHaveBeenCalledTimes(1); // feed cached across keywords
    expect(http.get.mock.calls[0][0]).toBe('https://oauth.reddit.com/r/sysadminjobs+devopsjobs/new?limit=100&raw_json=1');
    expect(http.get.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('caches a failed feed so it is not re-requested for every keyword', async () => {
    vi.stubEnv('REDDIT_CLIENT_ID', '');
    const scraper = new RedditScraper();
    const http = fake(scraper);
    http.get.mockRejectedValue(new Error('403'));

    await expect(scraper.searchJobs('linux')).rejects.toThrow('403');
    await expect(scraper.searchJobs('devops')).rejects.toThrow('403');
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get.mock.calls[0][0]).toMatch(/^https:\/\/www\.reddit\.com\/r\/.+\/new\.json/);
  });
});
