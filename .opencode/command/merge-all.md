---
description: Merge all READY session branches into one verified integration, then main.
agent: merger
---

Merge this session: collect every order with status ready from .opencode/ORDERS.md, cut an integration branch from origin/main, merge each with build and lint gates, mark conflicts without forcing, then merge the integration into main, rebuild, push, and report merged versus conflicted branches.
