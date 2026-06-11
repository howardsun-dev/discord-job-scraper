import 'reflect-metadata';
import 'dotenv/config';
import { scraperManager } from '../scrapers/index.js';
import { jobService } from '../services/JobService.js';
import { JobSource } from '../types/job.js';

const keywords = process.argv[2] || process.env.DEFAULT_KEYWORDS || 'software engineer';
const location = process.argv[3] || process.env.DEFAULT_LOCATION || 'remote';
const maxPages = parseInt(process.env.SCRAPER_MAX_PAGES || '1', 10);

async function main() {
  console.log(`🔍 Manual scrape: "${keywords}" in "${location}" (${maxPages} page(s) per source)`);

  await jobService.initialize();
  await scraperManager.initialize();

  try {
    const jobs = await scraperManager.scrapeAllSources(keywords, location, {}, maxPages);
    const bySource = new Map<JobSource, typeof jobs>();

    for (const job of jobs) {
      if (!job.source) continue;
      const sourceJobs = bySource.get(job.source) || [];
      sourceJobs.push(job);
      bySource.set(job.source, sourceJobs);
    }

    for (const [source, sourceJobs] of bySource) {
      const saved = await jobService.saveJobs(sourceJobs, source);
      console.log(`💾 ${source}: saved ${saved.length} jobs`);
    }

    const stats = await jobService.getJobStats();
    console.log(`📊 Done: ${stats.total} total jobs, ${stats.unposted} unposted`);
  } finally {
    await scraperManager.close();
  }
}

main().catch((error) => {
  console.error('❌ Manual scrape failed:', error);
  process.exit(1);
});