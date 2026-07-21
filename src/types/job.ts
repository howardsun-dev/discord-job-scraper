export const JOB_SOURCES = ['indeed', 'linkedin', 'glassdoor', 'reddit'] as const;
export type JobSource = (typeof JOB_SOURCES)[number];

export interface JobSearchFilters {
  keywords?: string[];
  location?: string;
  remoteOnly?: boolean;
  excludeKeywords?: string[];
  sources?: JobSource[];
  maxAgeDays?: number;
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