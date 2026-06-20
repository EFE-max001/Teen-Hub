---
name: AI Provider Map
description: Which AI providers handle which roles in QuestHub V4, and which replacements are in place
---

## Active Provider Map

| Role | Original | Replacement | Status |
|------|----------|-------------|--------|
| Classification / moderation (HF) | HuggingFace | — (working) | ✅ `router.huggingface.co` URL required |
| Reasoning / eval (Mistral) | Mistral | — (working) | ✅ `mistral-small-latest` |
| Risk / anomaly engine (Grok) | xAI Grok | OpenRouter → `anthropic/claude-3-haiku` | OpenRouter key valid, paid credits needed |
| Deep analysis (Gemini) | Google Gemini | OpenRouter → `google/gemini-flash-1.5` | Gemini quota exhausted on both keys |

## Fallback Chain
All OpenRouter calls fall back to direct Mistral if OpenRouter fails (rate-limit or no credits).
This means the system is always functional, and auto-upgrades when credits are added.

**Why:** Grok and Gemini had no working credits at build time. OpenRouter was the cleanest routing layer since the key is valid — once credits are added, all roles automatically use the intended premium models.

**How to apply:** If adding a new AI task, use `openRouterChat()` with a fallback, or `mistralChat()` for guaranteed availability.
