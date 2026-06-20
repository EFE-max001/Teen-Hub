---
name: NextAuth route filename
description: The [...nextauth].ts file must use ASCII dots, not Unicode ellipsis
---

The NextAuth catch-all route must be `pages/api/auth/[...nextauth].ts` using three ASCII dots (...). If it's named with the Unicode ellipsis character (…), Next.js will throw MISSING_NEXTAUTH_API_ROUTE_ERROR.

**Why:** The Replit editor or file creation tool sometimes substitutes the ellipsis character (U+2026) for three dots. Always verify with `ls` after creation.

**How to apply:** After creating the file, run `ls pages/api/auth/` to verify the filename is correct. Delete any file with the Unicode ellipsis.
