# Orders Ledger

The Commander's memory. Every order lives here from idea to READY. The human merges READY branches on return.

Status flow: `planned` → `in-progress` → `in-review` → `rework` (max 3 rounds) → `ready` → `merged` | `conflict` | `blocked`

| ID | Task | Plan / acceptance | Branch | Status | Attempts | Notes |
|----|------|-------------------|--------|--------|----------|-------|
| 001 | _example: memoize command palette_ | Scope: palette components only. Accept: build+lint green, no behavior change. | `agent/001-palette-memo` | planned | 0 | _example row, delete me_ |
