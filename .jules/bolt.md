# Bolt Journal: Performance Optimizations & Insights

## Dexie IndexedDB Batch Operations
- **Problem:** Sequential `await db.table.put(...)` within loops causes significant I/O overhead and spawns multiple IndexedDB transactions, bottlenecking database migrations or batch operations.
- **Solution:** Accumulate objects in memory and use `await db.table.bulkPut(items)` to execute the insertion/update in a single optimized transaction.
- **Outcome:** Reduced migration time from ~18ms down to ~2ms (>3.3x–8.7x speedup) for 15 preference items in StudentOS IndexedDB migrations.
