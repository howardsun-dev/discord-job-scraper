import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildSearchUrl,
  cleanText,
  extractSalary,
  generateExternalId,
  isRemote,
  parsePostedDate,
  positiveInteger,
  randomDelay,
  resolveJobUrl,
} from '../utils/helpers.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('helper utilities', () => {
  it('normalizes whitespace when cleaning text', () => {
    expect(cleanText('  Senior\n\tSoftware   Engineer  ')).toBe('Senior Software Engineer');
  });

  it('extracts common salary formats from job text', () => {
    expect(extractSalary('Compensation: $120,000 - $160,000 / year')).toBe('$120,000 - $160,000 / year');
    expect(extractSalary('Pay range 90k - 130k plus equity')).toBe('90k - 130k');
    expect(extractSalary('Earn up to $85,000')).toBe('up to $85,000');
  });

  it('detects remote locations', () => {
    expect(isRemote('Remote - United States')).toBe(true);
    expect(isRemote('Work from home')).toBe(true);
    expect(isRemote('New York, NY')).toBe(false);
  });

  it('parses relative and explicit posted dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 31, 12));

    expect(parsePostedDate('just posted')).toEqual(new Date(2026, 2, 31, 12));
    expect(parsePostedDate('yesterday')).toEqual(new Date(2026, 2, 30, 12));
    expect(parsePostedDate('2 hours ago')).toEqual(new Date(2026, 2, 31, 10));
    expect(parsePostedDate('2 weeks ago')).toEqual(new Date(2026, 2, 17, 12));
    expect(parsePostedDate('1 month ago')).toEqual(new Date(2026, 1, 28, 12));
    expect(parsePostedDate('Posted 02/28/2026')).toEqual(new Date(2026, 1, 28));
    expect(parsePostedDate('Posted 02/31/2026')).toBeNull();
    expect(parsePostedDate('2026-07-18')).toEqual(new Date(2026, 6, 18));
  });

  it('validates delay bounds', async () => {
    vi.useFakeTimers();
    const delay = randomDelay(5, 5);
    await vi.advanceTimersByTimeAsync(5);
    await expect(delay).resolves.toBeUndefined();
    expect(() => randomDelay(10, 5)).toThrow(RangeError);
  });

  it('builds encoded search URLs without empty parameters', () => {
    expect(buildSearchUrl('https://example.com', '/jobs', {
      q: 'react developer',
      location: 'New York',
      unused: '',
    })).toBe('https://example.com/jobs?q=react+developer&location=New+York');
  });

  it('resolves relative, absolute, and protocol-relative job URLs', () => {
    expect(resolveJobUrl('/viewjob?id=1', 'https://www.indeed.com')).toBe(
      'https://www.indeed.com/viewjob?id=1',
    );
    expect(resolveJobUrl('https://jobs.example.com/1', 'https://www.indeed.com')).toBe(
      'https://jobs.example.com/1',
    );
    expect(resolveJobUrl('//jobs.example.com/1', 'https://www.indeed.com')).toBe(
      'https://jobs.example.com/1',
    );
    expect(resolveJobUrl(undefined, 'https://www.indeed.com')).toBe('');
  });

  it('generates stable source-scoped SHA-256 identifiers', () => {
    const id = generateExternalId('https://example.com/jobs/1', 'indeed');
    expect(id).toMatch(/^indeed_[a-f0-9]{64}$/);
    expect(id).toBe(generateExternalId('https://example.com/jobs/1', 'indeed'));
    expect(id).not.toBe(generateExternalId('https://example.com/jobs/2', 'indeed'));
  });

  it('accepts only positive integer configuration values', () => {
    expect(positiveInteger('3', 1)).toBe(3);
    expect(positiveInteger('0', 1)).toBe(1);
    expect(positiveInteger('-2', 1)).toBe(1);
    expect(positiveInteger('1.5', 1)).toBe(1);
    expect(positiveInteger('nope', 1)).toBe(1);
  });
});
