---
name: AI Provider Map
description: Which AI providers/models handle which roles in QuestHub V5, all-free routing chain, and which keys have no credits
---

## Active Provider Map (V5 — verified 2026-07-09)

| Role | Provider(s) used | Notes |
|------|------|-------|
| Classification / moderation stage 1 | HuggingFace | `router.huggingface.co` URL required; working |
| Moderation stage 2 (safety classifier) | OpenRouter `nvidia/nemotron-3.5-content-safety:free` | purpose-built for this task |
| Risk / pattern detection | OpenRouter `nvidia/nemotron-nano-9b-v2:free` → `nvidia/nemotron-3-nano-30b-a3b:free` | fast/small models |
| Deep analysis / long reasoning | OpenRouter `nvidia/nemotron-3-ultra-550b-a55b:free` → `nvidia/nemotron-3-super-120b-a12b:free` | largest free models available |
| Chain-of-thought (trial eval, admin rec) | OpenRouter `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | reasoning-tuned |
| General router / default | OpenRouter `google/gemma-4-31b-it:free` → `openai/gpt-oss-20b:free` | |
| Reasoning fallback | Mistral `mistral-small-latest` | always-available last resort |
| Secondary direct provider | NVIDIA NIM (`integrate.api.nvidia.com`) | free tier; used as fallback layer + directly |

## Fallback Chain
Every `openRouterChat()` call tries: OR key #1 (primary model) → OR key #2 (primary model) → OR key #1 (fallback model) → OR key #2 (fallback model) → NVIDIA NIM direct → Mistral. Two separate OpenRouter API keys are rotated automatically on any failure (rate-limit, 404, etc), not just one.

**Why:** OpenRouter's free-tier model catalog changes frequently and many listed `:free` models 404 ("unavailable for free") or intermittently 429. A single key/model was too fragile; rotating keys + same-purpose fallback models + a wholly separate provider (NVIDIA) + Mistral keeps every feature functional even when several links in the chain are down simultaneously.

**How to apply:** When adding a new AI task, call `openRouterChat()` with both a primary `model` and a `fallbackModel` (pick two different providers within the `:free` list), and let `fallbackToMistral` stay true unless the task truly requires JSON structure Mistral can't produce reliably.

## Known dead ends
- `Grok_Api_Key` (xAI) exists in secrets but the account has **no credits/licenses** — every model returns 403 `permission-denied`. Excluded from routing until the user adds credits.
- Most `:free`-suffixed OpenRouter models advertised in docs/blog posts (e.g. `mistralai/mistral-7b-instruct:free`, `deepseek/deepseek-r1:free`, `qwen/qwen-2.5-72b-instruct:free`) are **no longer free** — they 404 with "use this slug instead" pointing at the paid version. Always verify via `GET /api/v1/models` and filter `id.endsWith(':free')` before wiring in a model — don't trust remembered model names.
