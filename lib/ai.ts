/**
 * QuestHub AI Engine — lib/ai.ts
 *
 * Provider roles (from blueprint):
 *   HuggingFace  → First-layer moderation (toxicity, spam, classification)
 *   Mistral      → Reasoning engine (trial summaries, trust analysis)
 *   Grok (xAI)  → Risk engine (anomaly detection, behavior patterns)
 *   OpenRouter   → Master router (routes to cheapest/best model per task)
 *   Gemini       → Deep analysis (image review, scoring, profile verification)
 */

const HF_BASE = 'https://router.huggingface.co/hf-inference/models'
const HF_KEY  = () => process.env.HuggingFace_Api_Key!

const MISTRAL_BASE = 'https://api.mistral.ai/v1'
const MISTRAL_KEY  = () => process.env.Mistral_Api_Key!

const GROK_BASE = 'https://api.x.ai/v1'
const GROK_KEY  = () => process.env.Grok_Api_Key!

const OR_BASE = 'https://openrouter.ai/api/v1'
const OR_KEY  = () => process.env.OpenRouter_Api_Key!

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_KEY  = () => process.env.Gimini_Api_Key!

// ─── Default models ────────────────────────────────────────────────────────
const MODELS = {
  mistral:    'mistral-small-latest',
  grok:       'grok-3-mini',
  openrouter: 'meta-llama/llama-3.2-3b-instruct:free',
  gemini:     'gemini-2.0-flash',
}

// ─── HuggingFace ───────────────────────────────────────────────────────────

/**
 * Classify text toxicity / sentiment.
 * Returns array of { label, score } sorted by score desc.
 */
export async function hfClassify(
  text: string,
  model = 'distilbert/distilbert-base-uncased-finetuned-sst-2-english'
): Promise<{ label: string; score: number }[]> {
  const res = await fetch(`${HF_BASE}/${model}/pipeline/text-classification`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HF_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text }),
  })
  if (!res.ok) throw new Error(`HF error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return (Array.isArray(data[0]) ? data[0] : data) as { label: string; score: number }[]
}

/**
 * Zero-shot classify text into provided labels.
 */
export async function hfZeroShot(
  text: string,
  labels: string[],
  model = 'facebook/bart-large-mnli'
): Promise<{ labels: string[]; scores: number[] }> {
  const res = await fetch(`${HF_BASE}/${model}/pipeline/zero-shot-classification`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HF_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text, parameters: { candidate_labels: labels } }),
  })
  if (!res.ok) throw new Error(`HF error ${res.status}: ${await res.text()}`)
  return res.json()
}

// ─── Mistral ───────────────────────────────────────────────────────────────

interface MistralMessage { role: 'user' | 'assistant' | 'system'; content: string }

/**
 * Send a chat completion request to Mistral.
 */
export async function mistralChat(
  messages: MistralMessage[],
  opts: { model?: string; maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const res = await fetch(`${MISTRAL_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${MISTRAL_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model ?? MODELS.mistral,
      messages,
      max_tokens: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.3,
    }),
  })
  if (!res.ok) throw new Error(`Mistral error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content as string
}

// ─── Grok (xAI) ────────────────────────────────────────────────────────────

interface GrokMessage { role: 'user' | 'assistant' | 'system'; content: string }

/**
 * Send a chat completion request to Grok.
 * Requires xAI account credits at https://console.x.ai
 */
export async function grokChat(
  messages: GrokMessage[],
  opts: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const res = await fetch(`${GROK_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROK_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model ?? MODELS.grok,
      messages,
      max_tokens: opts.maxTokens ?? 512,
    }),
  })
  if (!res.ok) throw new Error(`Grok error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content as string
}

// ─── OpenRouter ────────────────────────────────────────────────────────────

interface ORMessage { role: 'user' | 'assistant' | 'system'; content: string }

/**
 * Route a request through OpenRouter (cheapest model for the task).
 */
export async function openRouterChat(
  messages: ORMessage[],
  opts: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OR_KEY()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://questhub.io',
      'X-Title': 'QuestHub Guild',
    },
    body: JSON.stringify({
      model: opts.model ?? MODELS.openrouter,
      messages,
      max_tokens: opts.maxTokens ?? 512,
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content as string
}

// ─── Gemini ────────────────────────────────────────────────────────────────

/**
 * Send a text prompt to Gemini.
 * Requires Google AI Studio billing (free quota exhausted).
 */
export async function geminiChat(
  prompt: string,
  opts: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const model = opts.model ?? MODELS.gemini
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_KEY()}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: opts.maxTokens ?? 512, temperature: 0.3 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text as string
}

// ─── High-level task helpers ───────────────────────────────────────────────

/**
 * MESSAGE MODERATION PIPELINE (HF → Grok → Mistral)
 * Returns: { safe, toxicityScore, reason }
 */
export async function moderateMessage(text: string) {
  const [sentiment] = await hfClassify(text).catch(() => [{ label: 'POSITIVE', score: 0.5 }])
  const toxicityScore = sentiment.label === 'NEGATIVE' ? sentiment.score : 1 - sentiment.score

  if (toxicityScore < 0.7) return { safe: true, toxicityScore, reason: null }

  const reason = await mistralChat([
    { role: 'system', content: 'You are a content moderator. In one sentence, explain why this message may be harmful.' },
    { role: 'user', content: text },
  ], { maxTokens: 80 }).catch(() => 'Content flagged by classifier')

  return { safe: false, toxicityScore, reason }
}

/**
 * TRIAL EVALUATION (Mistral primary, Gemini deep)
 * Returns: { score, summary, recommendation }
 */
export async function evaluateTrial(trial: {
  strengths: string
  whyJoin: string
  skills: string[]
  availability: string
}) {
  const prompt = `You are evaluating a guild applicant. Score them 0-100 and give a brief recommendation.

Strengths: ${trial.strengths}
Why they want to join: ${trial.whyJoin}
Skills: ${trial.skills.join(', ')}
Availability: ${trial.availability}

Respond in JSON: { "score": number, "summary": string, "recommendation": "ACCEPT"|"REVIEW"|"REJECT" }`

  const raw = await mistralChat([{ role: 'user', content: prompt }], { maxTokens: 256 })
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : { score: 50, summary: raw, recommendation: 'REVIEW' }
  } catch {
    return { score: 50, summary: raw, recommendation: 'REVIEW' }
  }
}

/**
 * QUEST MATCHING (OpenRouter)
 * Returns ranked list of quest IDs best suited to the member.
 */
export async function matchQuests(
  member: { rank: string; skills: string[]; xp: number },
  questTitles: { id: string; title: string; category: string; difficulty: string }[]
) {
  if (!questTitles.length) return []

  const prompt = `Rank these quests for a guild member with rank ${member.rank}, skills [${member.skills.join(', ')}], and ${member.xp} XP.
Quests: ${questTitles.map(q => `[${q.id}] ${q.title} (${q.category}, ${q.difficulty})`).join('\n')}
Return JSON array of IDs in order of best fit. Only return the JSON array, nothing else.`

  const raw = await openRouterChat([{ role: 'user', content: prompt }], { maxTokens: 256 })
    .catch(() => JSON.stringify(questTitles.map(q => q.id)))

  try {
    const match = raw.match(/\[[\s\S]*\]/)
    return match ? JSON.parse(match[0]) : questTitles.map(q => q.id)
  } catch {
    return questTitles.map(q => q.id)
  }
}
