---
name: Full-page animated canvas backgrounds
description: How to mount a fixed animated canvas behind all app content
---

To add a full-page animated background (e.g. an animated grid/particle effect) behind an entire app:

1. Create the canvas component as `fixed inset-0 -z-10 pointer-events-none` and mount it once at the root layout (e.g. `_app.tsx`), not per-page.
2. Audit every layout wrapper between the canvas and page content for opaque background colors/classes (e.g. a `bg-deep-black` or similar solid class on the main flex container). These will fully hide the canvas even though it's behind them, because CSS negative z-index only helps within the same stacking context — an opaque sibling/ancestor background still paints over it.
3. Change those wrapper backgrounds to transparent (keep opaque backgrounds only on chrome elements like sidebars/headers that are meant to stay solid panels).

**Why:** This was non-obvious — the canvas rendered fine standalone but was invisible until the dashboard layout's root wrapper background was made transparent.
