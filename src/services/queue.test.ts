import { describe, it, expect } from 'vitest';

// Sequential queue processing implementation (Baseline)
export async function processQueueSequential<T>(
  items: T[],
  processItem: (item: T) => Promise<void>
): Promise<number> {
  let successCount = 0;
  for (const item of items) {
    try {
      await processItem(item);
      successCount++;
    } catch (e) {
      // Keep for retry
    }
  }
  return successCount;
}

// Parallel chunked queue processing implementation (Optimized)
export async function processQueueParallelChunked<T>(
  items: T[],
  processItem: (item: T) => Promise<void>,
  chunkSize = 5
): Promise<number> {
  let successCount = 0;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const results = await Promise.allSettled(
      chunk.map(async (item) => {
        await processItem(item);
        return item;
      })
    );
    for (const res of results) {
      if (res.status === 'fulfilled') {
        successCount++;
      }
    }
  }
  return successCount;
}

describe('Offline Queue Processing Performance & Functionality', () => {
  it('processes queue items correctly and handles failures', async () => {
    const items = [1, 2, 3, 4, 5];
    const processed: number[] = [];
    const processItem = async (num: number) => {
      if (num === 3) throw new Error('Simulated network error');
      processed.push(num);
    };

    const count = await processQueueParallelChunked(items, processItem, 5);
    expect(count).toBe(4);
    expect(processed.sort()).toEqual([1, 2, 4, 5]);
  });

  it('demonstrates parallel batching speedup over sequential processing', async () => {
    const itemCount = 10;
    const simulatedLatencyMs = 30;
    const items = Array.from({ length: itemCount }, (_, i) => i);

    const mockSyncItem = async (_item: number) => {
      await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs));
    };

    // Measure Sequential (Baseline)
    const startSeq = performance.now();
    await processQueueSequential(items, mockSyncItem);
    const timeSeq = performance.now() - startSeq;

    // Measure Parallel Chunked (Optimized, chunk size 5)
    const startPar = performance.now();
    await processQueueParallelChunked(items, mockSyncItem, 5);
    const timePar = performance.now() - startPar;

    console.log(`[Queue Benchmark] Sequential (${itemCount} items): ${timeSeq.toFixed(2)}ms`);
    console.log(`[Queue Benchmark] Parallel Chunked (${itemCount} items, chunkSize 5): ${timePar.toFixed(2)}ms`);
    console.log(`[Queue Benchmark] Speedup: ${(timeSeq / timePar).toFixed(2)}x faster`);

    // Parallel execution should be at least ~1.8x - 4x faster
    expect(timePar).toBeLessThan(timeSeq);
  });
});
