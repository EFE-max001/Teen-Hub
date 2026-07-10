---
name: .replit port config is tool-owned
description: How to change port mappings in .replit and what to expect
---

Direct edits to `.replit` (including the `[[ports]]` blocks) are blocked by the system — must go through the owning tool.

**Why:** `.replit` is managed by Replit's workflow tooling; hand-editing it is disallowed even for seemingly simple config like port mappings.

**How to apply:** Use `configureWorkflow({ name, command, waitForPort, outputType })` (and `removeWorkflow` if recreating) via the code_execution sandbox to change the port a workflow listens on. Note: stale/duplicate `[[ports]]` entries from prior configs (e.g. an old `localPort = 3000` mapping) can persist even after reconfiguring to a single workflow on a new port. If no workflow actually uses the stale port and the app serves correctly on the configured port, treat the leftover entry as harmless dead config rather than a blocking bug.
