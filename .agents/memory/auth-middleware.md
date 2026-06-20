---
name: Auth middleware pattern
description: Pattern used for requireAuth in lib/middleware.ts and how pages consume it
---

requireAuth returns `null` when auth passes, or `{ redirect: { destination, permanent } }` when it fails. Pages check `if (redirect) return redirect`. This avoids TypeScript's discriminated union narrowing bug with `!result.ok` or `'redirect' in result` patterns.

**Why:** TypeScript's `in` operator narrowing is unreliable for optional properties; `!bool` narrowing on tagged unions can also fail in certain contexts.

**How to apply:** Always use `const redirect = await requireAuth(context, 'ROLE'); if (redirect) return redirect`. When session data is also needed, call `getServerSession` separately after the guard.
