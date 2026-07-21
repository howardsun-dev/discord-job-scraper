import cron, { type ScheduledTask } from 'node-cron';
import { scraperManager } from '../scrapers/index.js';
import { jobService } from '../services/JobService.js';
import { JobSearchFilters, JobSource, ScrapedJobData } from '../types/job.js';

export interface ScraperJobConfig {
  schedule: string;
  keywords: string[];
  location: string;
  filters?: JobSearchFilters;
  maxPages?: number;
  enabled: boolean;
}

export class ScraperScheduler {
  private jobs: Map<string, ScheduledTask> = new Map();
  private defaultConfig: ScraperJobConfig = {
    schedule: '0 */4 * * *', // Every 4 hours
    keywords: ['software engineer', 'full stack', 'backend', 'frontend', 'typescript', 'react', 'node.js'],
    location: 'remote',
    filters: {
      remoteOnly: true,
      maxAgeDays: 7,
      excludeKeywords: ['senior', 'lead', 'principal', 'architect', 'manager', 'director'],
    },
    maxPages: 2,
    enabled: true,
  };

  start(config?: Partial<ScraperJobConfig>): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    if (!finalConfig.enabled) {
      console.log('⏸️ Scraper scheduler disabled');
      return;
    }

    const existingTask = this.jobs.get('default');
    if (existingTask) {
      existingTask.stop();
      this.jobs.delete('default');
    }

    const task = cron.schedule(finalConfig.schedule, async () => {
      console.log('⏰ Running scheduled job scrape...');
      await this.runScrape(finalConfig);
    });

    this.jobs.set('default', task);
    console.log(`✅ Scraper scheduler started with schedule: ${finalConfig.schedule}`);
  }

  stop(): void {
    for (const [name, task] of this.jobs) {
      task.stop();
      console.log(`⏹️ Stopped scraper job: ${name}`);
    }
    this.jobs.clear();
  }

  async runScrape(config: ScraperJobConfig): Promise<void> {
    try {
      await scraperManager.initialize();
      await jobService.initialize();

      for (const keyword of config.keywords) {
        console.log(`🔍 Searching for: ${keyword}`);
        
        const jobs = await scraperManager.scrapeAllSources(
          keyword,
          config.location,
          config.filters,
          config.maxPages
        );

        if (jobs.length > 0) {
          // Group by source and save
          const bySource = new Map<JobSource, ScrapedJobData[]>();
          for (const job of jobs) {
            if (job.source) {
              const sourceJobs = bySource.get(job.source) || [];
              sourceJobs.push(job);
              bySource.set(job.source, sourceJobs);
            }
          }

          for (const [source, sourceJobs] of bySource) {
            const saved = await jobService.saveJobs(sourceJobs, source);
            console.log(`💾 Saved ${saved.length} jobs from ${source}`);
          }
        }
      }

      const stats = await jobService.getJobStats();
      console.log(`📊 Job stats: ${stats.total} total, ${stats.unposted} unposted`);
      console.log('   By source:', stats.bySource);
    } catch (error) {
      console.error('❌ Scheduled scrape failed:', error);
    } finally {
      await scraperManager.close();
    }
  }

  async runOnce(config?: Partial<ScraperJobConfig>): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    await this.runScrape(finalConfig);
  }

  getStatus(): { running: number; jobs: string[] } {
    return {
      running: this.jobs.size,
      jobs: Array.from(this.jobs.keys()),
    };
  }
}

export const scraperScheduler = new ScraperScheduler();