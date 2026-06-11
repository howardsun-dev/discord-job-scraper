export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: JobSource;
  postedDate: Date;
  salary?: string;
  remote: boolean;
  keywords: string[];
}

export type JobSource = 'indeed' | 'linkedin' | 'glassdoor' | 'reddit';

export interface JobSearchFilters {
  keywords?: string[];
  location?: string;
  remoteOnly?: boolean;
  excludeKeywords?: string[];
  sources?: JobSource[];
  maxAgeDays?: number;
  minSalary?: number;
}

export interface ScrapedJobData {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
  postedDate?: Date | null;
  source?: JobSource;
}

export interface ScraperConfig {
  baseUrl: string;
  searchPath: string;
  selectors: {
    jobCard: string;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    salary?: string;
    postedDate?: string;
  };
  pagination?: {
    type: 'query' | 'path';
    param: string;
    maxPages: number;
  };
  rateLimitMs: number;
}