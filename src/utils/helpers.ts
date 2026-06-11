export function randomDelay(minMs: number, maxMs: number): Promise<void> {
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
    const d = new Date(now);
    d.setMonth(d.getMonth() - parseInt(monthMatch[1], 10));
    return d;
  }

  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    return new Date(parseInt(dateMatch[3], 10), parseInt(dateMatch[1], 10) - 1, parseInt(dateMatch[2], 10));
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