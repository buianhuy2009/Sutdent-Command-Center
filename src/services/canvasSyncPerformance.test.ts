import { describe, it, expect } from 'vitest';

async function mockSyncCanvasToSheet(item: { id: string; name: string }): Promise<void> {
  // Simulate network/async latency per item (e.g. 50ms)
  await new Promise((resolve) => setTimeout(resolve, 50));
}

describe('Canvas Batch Sync Performance Benchmark', () => {
  const pendingItems = Array.from({ length: 10 }, (_, i) => ({
    id: `item-${i}`,
    name: `Assignment ${i}`,
  }));

  it('measures sequential sync execution time', async () => {
    const start = Date.now();
    for (const item of pendingItems) {
      await mockSyncCanvasToSheet(item);
    }
    const elapsed = Date.now() - start;
    console.log(`Sequential sync for ${pendingItems.length} items took ${elapsed}ms`);
    // 10 items * 50ms should take >= 500ms
    expect(elapsed).toBeGreaterThanOrEqual(450);
  });

  it('measures concurrent sync execution time', async () => {
    const start = Date.now();
    await Promise.all(pendingItems.map((item) => mockSyncCanvasToSheet(item)));
    const elapsed = Date.now() - start;
    console.log(`Concurrent sync for ${pendingItems.length} items took ${elapsed}ms`);
    // Concurrent execution of 10 items with 50ms latency should finish in ~50-150ms
    expect(elapsed).toBeLessThan(300);
  });
});
