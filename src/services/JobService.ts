import { getJobRepository, initializeDatabase } from '../database/index.js';
import { Job } from '../database/Job.js';
import { ScrapedJobData, JobSource, JobSearchFilters } from '../types/job.js';
import { escapeLikePattern, generateExternalId, isRemote } from '../utils/helpers.js';
import { In, LessThan } from 'typeorm';

export class JobService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await initializeDatabase();
    this.initialized = true;
  }

  async saveJobs(jobs: ScrapedJobData[], source: JobSource): Promise<Job[]> {
    const repo = getJobRepository();
    const savedJobs: Job[] = [];

    for (const jobData of jobs) {
      const externalId = this.generateExternalId(jobData.url, source);
      
      let job = await repo.findOne({ where: { source, externalId } });
      
      if (job) {
        job.title = jobData.title;
        job.company = jobData.company;
        job.location = jobData.location;
        job.description = jobData.description;
        job.url = jobData.url;
        job.salary = jobData.salary || null;
        job.postedDate = jobData.postedDate || null;
        job.remote = isRemote(jobData.location);
        job.keywords = this.extractKeywords(jobData);
      } else {
        job = repo.create({
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          description: jobData.description,
          url: jobData.url,
          source,
          externalId,
          postedDate: jobData.postedDate || null,
          salary: jobData.salary || null,
          remote: isRemote(jobData.location),
          keywords: this.extractKeywords(jobData),
          postedToDiscord: false,
        });
      }

      const saved = await repo.save(job);
      savedJobs.push(saved);
    }

    return savedJobs;
  }

  private generateExternalId(url: string, source: JobSource): string {
    return generateExternalId(url, source);
  }

  private extractKeywords(jobData: ScrapedJobData): string[] {
    const text = `${jobData.title} ${jobData.description} ${jobData.company}`.toLowerCase();
    const techKeywords = [
      'typescript', 'javascript', 'react', 'node', 'python', 'java', 'go', 'rust',
      'aws', 'docker', 'kubernetes', 'sql', 'nosql', 'mongodb', 'postgresql',
      'graphql', 'rest', 'microservices', 'ci/cd', 'devops', 'cloud',
      'frontend', 'backend', 'fullstack', 'full-stack', 'mobile', 'ios', 'android',
      'machine learning', 'ai', 'data', 'analytics', 'security', 'testing',
    ];
    
    return techKeywords.filter(kw => text.includes(kw));
  }

  async findJobs(filters: JobSearchFilters = {}, limit = 20): Promise<Job[]> {
    const repo = getJobRepository();
    const qb = repo.createQueryBuilder('job');

    if (filters.keywords && filters.keywords.length > 0) {
      const conditions = filters.keywords.map((_, i) =>
        `(job.title ILIKE :kw${i} ESCAPE '!' OR job.description ILIKE :kw${i} ESCAPE '!' OR job.company ILIKE :kw${i} ESCAPE '!')`
      );
      qb.andWhere(`(${conditions.join(' OR ')})`);
      filters.keywords.forEach((keyword, i) =>
        qb.setParameter(`kw${i}`, `%${escapeLikePattern(keyword)}%`)
      );
    }

    if (filters.location) {
      qb.andWhere('job.location ILIKE :location', { location: `%${filters.location}%` });
    }

    if (filters.remoteOnly) {
      qb.andWhere('job.remote = true');
    }

    if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
      const excludeConditions = filters.excludeKeywords.map((kw, i) => 
        `job.title NOT ILIKE :exkw${i} AND job.description NOT ILIKE :exkw${i}`
      ).join(' AND ');
      qb.andWhere(excludeConditions);
      filters.excludeKeywords.forEach((kw, i) => {
        qb.setParameter(`exkw${i}`, `%${kw}%`);
      });
    }

    if (filters.sources && filters.sources.length > 0) {
      qb.andWhere('job.source IN (:...sources)', { sources: filters.sources });
    }

    if (filters.maxAgeDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.maxAgeDays);
      qb.andWhere('(job.postedDate >= :cutoff OR job.postedDate IS NULL)', { cutoff: cutoffDate });
    }

    qb.andWhere('job.postedToDiscord = false');
    qb.orderBy('job.postedDate', 'DESC')
      .addOrderBy('job.createdAt', 'DESC')
      .limit(limit);

    return qb.getMany();
  }

  async markAsPosted(jobIds: string[]): Promise<void> {
    if (jobIds.length === 0) return;
    const repo = getJobRepository();
    await repo.update(
      { id: In(jobIds) },
      { postedToDiscord: true, postedAt: new Date() }
    );
  }

  async getJobStats(): Promise<{ total: number; bySource: Record<string, number>; unposted: number }> {
    const repo = getJobRepository();
    const total = await repo.count();
    const unposted = await repo.count({ where: { postedToDiscord: false } });
    
    const bySourceResult = await repo
      .createQueryBuilder('job')
      .select('job.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .groupBy('job.source')
      .getRawMany();
    
    const bySource: Record<string, number> = {};
    for (const row of bySourceResult) {
      bySource[row.source] = parseInt(row.count, 10);
    }

    return { total, bySource, unposted };
  }

  async cleanupOldJobs(maxAgeDays = 30): Promise<number> {
    const repo = getJobRepository();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    
    const result = await repo.delete({
      postedDate: LessThan(cutoffDate),
      postedToDiscord: true,
    });
    
    return result.affected || 0;
  }
}

export const jobService = new JobService();