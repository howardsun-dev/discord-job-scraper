import { describe, expect, it, vi } from 'vitest';
import { ScraperManager } from './index.js';

describe('ScraperManager', () => {
  it('serializes scraper ownership across concurrent operations', async () => {
    const manager = new ScraperManager();
    vi.spyOn(manager, 'initialize').mockResolvedValue();
    vi.spyOn(manager, 'close').mockResolvedValue();

    const events: string[] = [];
    let finishFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      finishFirst = resolve;
    });

    const first = manager.runExclusive(async () => {
      events.push('first:start');
      await firstGate;
      events.push('first:end');
    });
    const second = manager.runExclusive(async () => {
      events.push('second:start');
      events.push('second:end');
    });

    await vi.waitFor(() => expect(events).toEqual(['first:start']));
    finishFirst();
    await Promise.all([first, second]);

    expect(events).toEqual(['first:start', 'first:end', 'second:start', 'second:end']);
    expect(manager.initialize).toHaveBeenCalledTimes(2);
    expect(manager.close).toHaveBeenCalledTimes(2);
  });
});
