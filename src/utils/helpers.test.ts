import { describe, expect, it } from 'vitest';
import { cleanText, extractSalary, isRemote, parsePostedDate } from '../utils/helpers.js';

describe('helper utilities', () => {
  it('normalizes whitespace when cleaning text', () => {
    expect(cleanText('  Senior\n\tSoftware   Engineer  ')).toBe('Senior Software Engineer');
  });

  it('extracts common salary formats from job text', () => {
    expect(extractSalary('Compensation: $120,000 - $160,000 / year')).toBe('$120,000 - $160,000 / year');
    expect(extractSalary('Pay range 90k - 130k plus equity')).toBe('90k - 130k');
  });

  it('detects remote locations', () => {
    expect(isRemote('Remote - United States')).toBe(true);
    expect(isRemote('Work from home')).toBe(true);
    expect(isRemote('New York, NY')).toBe(false);
  });

  it('parses relative posted dates', () => {
    const twoDaysAgo = parsePostedDate('2 days ago');
    expect(twoDaysAgo).toBeInstanceOf(Date);
    expect(twoDaysAgo!.getTime()).toBeLessThan(Date.now());
  });
});