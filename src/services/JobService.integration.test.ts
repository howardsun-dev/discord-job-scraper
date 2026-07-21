import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource, getJobRepository } from '../database/index.js';
import { jobService } from './JobService.js';

const describeWithDatabase = process.env.RUN_DB_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('JobService PostgreSQL integration', () => {
  beforeAll(async () => {
    await jobService.initialize();
    await getJobRepository().clear();
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('deduplicates jobs and applies keyword and age filters', async () => {
    await jobService.saveJobs([
      {
        title: 'React Engineer',
        company: 'Example Co',
        location: 'Remote',
        description: 'Build TypeScript applications',
        url: 'https://example.com/jobs/1',
        postedDate: null,
      },
      {
        title: 'Backend Engineer',
        company: 'Database Co',
        location: 'New York, NY',
        description: 'Build PostgreSQL services',
        url: 'https://example.com/jobs/2',
        postedDate: new Date(),
      },
    ], 'indeed');

    await jobService.saveJobs([{
      title: 'Senior React Engineer',
      company: 'Example Co',
      location: 'Remote',
      description: 'Build TypeScript applications',
      url: 'https://example.com/jobs/1',
      postedDate: null,
    }], 'indeed');

    const matches = await jobService.findJobs({
      keywords: ['react', 'postgresql'],
      maxAgeDays: 7,
    });
    const stats = await jobService.getJobStats();

    expect(stats.total).toBe(2);
    expect(matches).toHaveLength(2);
    expect(matches.some((job) => job.postedDate === null)).toBe(true);
    expect(matches.find((job) => job.url.endsWith('/1'))?.title).toBe('Senior React Engineer');
  });
});
