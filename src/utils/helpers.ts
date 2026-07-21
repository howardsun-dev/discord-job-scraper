import { createHash } from 'node:crypto';
import type { JobSource } from '../types/job.js';

export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs) || minMs < 0 || minMs > maxMs) {
    throw new RangeError('Delay bounds must be finite, non-negative, and minMs must be <= maxMs');
  }
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

export function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function extractSalary(text: string): string | undefined {
  const salaryPatterns = [
    /\$[\d,]+(?:\.\d{2})?(?:\s*-\s*\$[\d,]+(?:\.\d{2})?)?(?:\s*\/\s*(?:yr|year|hr|hour|mo|month))/i,
    /[\d,]+k\s*-\s*[\d,]+k/i,
    /up to \$[\d,]+/i,
  ];
  for (const pattern of salaryPatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return undefined;
}

export function isRemote(location: string): boolean {
  const remoteKeywords = ['remote', 'work from home', 'wfh', 'anywhere', 'distributed', 'virtual'];
  const lower = location.toLowerCase();
  return remoteKeywords.some(kw => lower.includes(kw));
}

export function parsePostedDate(text: string): Date | null {
  const now = new Date();
  const lower = text.toLowerCase();

  if (lower.includes('just posted') || lower.includes('today')) {
    return now;
  }
  if (lower.includes('yesterday')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }

  const dayMatch = lower.match(/(\d+)\s*days?\s*ago/);
  if (dayMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() - parseInt(dayMatch[1], 10));
    return d;
  }

  const hourMatch = lower.match(/(\d+)\s*hours?\s*ago/);
  if (hourMatch) {
    const d = new Date(now);
    d.setHours(d.getHours() - parseInt(hourMatch[1], 10));
    return d;
  }

  const weekMatch = lower.match(/(\d+)\s*weeks?\s*ago/);
  if (weekMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() - parseInt(weekMatch[1], 10) * 7);
    return d;
  }

  const monthMatch = lower.match(/(\d+)\s*months?\s*ago/);
  if (monthMatch) {
    const monthsAgo = parseInt(monthMatch[1], 10);
    const targetMonthStart = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const lastDay = new Date(
      targetMonthStart.getFullYear(),
      targetMonthStart.getMonth() + 1,
      0,
    ).getDate();
    return new Date(
      targetMonthStart.getFullYear(),
      targetMonthStart.getMonth(),
      Math.min(now.getDate(), lastDay),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds(),
    );
  }

  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const year = parseInt(dateMatch[3], 10);
    const month = parseInt(dateMatch[1], 10) - 1;
    const day = parseInt(dateMatch[2], 10);
    const parsed = new Date(year, month, day);
    return parsed.getFullYear() === year && parsed.getMonth() === month && parsed.getDate() === day
      ? parsed
      : null;
  }

  const isoDateMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    const year = parseInt(isoDateMatch[1], 10);
    const month = parseInt(isoDateMatch[2], 10) - 1;
    const day = parseInt(isoDateMatch[3], 10);
    const parsed = new Date(year, month, day);
    return parsed.getFullYear() === year && parsed.getMonth() === month && parsed.getDate() === day
      ? parsed
      : null;
  }

  return null;
}

export function buildSearchUrl(baseUrl: string, path: string, params: Record<string, string>): string {
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
}

export function generateExternalId(url: string, source: JobSource): string {
  const digest = createHash('sha256').update(url).digest('hex');
  return `${source}_${digest}`;
}

export function resolveJobUrl(href: string | undefined, baseUrl: string): string {
  if (!href) return '';
  if (href.startsWith('//')) return `https:${href}`;
  return new URL(href, baseUrl).toString();
}

export function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[!%_]/g, '!$&');
}