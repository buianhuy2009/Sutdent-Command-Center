# Bolt Journal - Performance Patterns & Learnings

## Batch Operations and Promises Concurrency

### Problem Pattern: Sequential Loop Async Calls
When processing batch items with async operations (e.g. syncing items to external services), using `for (const item of pending) { await sync(item); }` causes sequential execution blocking, resulting in total runtime proportional to $N \times \text{latency}$.

### Solution
Wrap async tasks in `Promise.all(pending.map((item) => sync(item)))` to allow operations to run concurrently in parallel, reducing total batch execution time from $O(N \times \text{latency})$ down to $O(\text{latency})$.
