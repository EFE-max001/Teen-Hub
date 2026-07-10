---
name: Prisma schema workflow
description: How to apply Prisma schema changes when no migrations folder exists
---

This project has no `prisma/migrations` folder — the schema is managed via `prisma db push`, not `prisma migrate dev`.

**Why:** `prisma migrate dev` tries to create a baseline migration and, without an existing migrations history, wants to reset the whole database destructively before applying anything.

**How to apply:** Whenever schema.prisma changes, run `npx prisma db push --accept-data-loss` to sync the DB. Do not attempt `migrate dev` unless a migrations folder is deliberately introduced first.
