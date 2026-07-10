/**
 * QuestHub AI Engine — lib/ai.ts  (V5 — all-free routing)
 *
 * Provider map (all models below are verified FREE tiers as of 2026-07-09):
 *   HuggingFace  → First-layer moderation (toxicity, spam, classification)
 *   Mistral      → Reasoning engine (trial eval, trust, admin recs) — free-tier key
 *   OpenRouter   → Primary router for everything else. Two keys are rotated
 *                  automatically on rate-limit/failure (OpenRouter_Api_Key,
 *                  OpenRouter_Api_Key_2), each model call also has a same-purpose
 *                  fallback model, then falls through to NVIDIA NIM (direct),
 *                  then Mistral as the last resort.
 *   NVIDIA NIM   → Secondary direct provider (integrate.api.nvidia.com), free
 *                  tier. Used as a fallback layer and directly for a few tasks.
 *
 * Every model below was individually tested against its live endpoint before
 * being wired in. Models that 404'd ("unavailable for free") or were dropped
 * from the free catalog were removed. See .agents/memory/ai-providers.md.
 */

const HF_BASE  = 'https://router.huggingface.co/hf-inference/models'
const HF_KEY   = () => process.env.HuggingFace_Api_Key!

const MISTRAL_BASE = 'https://api.mistral.ai/v1'
const MISTRAL_KEY  = () => process.env.Mistral_Api_Key!

const OR_BASE = 'https://openrouter.ai/api/v1'
const OR_KEYS = () => [process.env.OpenRouter_Api_Key!, process.env.OpenRouter_Api_Key_2!].filter(Boolean)

const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1'
const NVIDIA_KEY  = () => process.env.NVIDIA_Api_Key!

// All OpenRouter models are `:free` variants confirmed live via test calls.
const MODELS = {
  // Fast reasoning fallback used directly by Mistral-based helpers
  reasoning:    'mistral-small-latest',

  // Purpose-built content-safety classifier — ideal for moderation stage 2
  moderation:       'nvidia/nemotron-3.5-content-safety:free',
  moderationFallback: 'nvidia/nemotron-nano-9b-v2:free',

  // Risk / pattern detection — small & fast models
  risk:         'nvidia/nemotron-nano-9b-v2:free',
  riskFree:     'nvidia/nemotron-3-nano-30b-a3b:free',

  // Deep analysis (quest submission review, long-context reasoning) — largest free models
  deep:         'nvidia/nemotron-3-ultra-550b-a55b:free',
  deepFree:     'nvidia/nemotron-3-super-120b-a12b:free',

  // Chain-of-thought reasoning tasks (trial evaluation quality checks, etc.)
  cot:          'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',

  // Default general-purpose router model
  router:       'google/gemma-4-31b-it:free',
  routerFallback: 'openai/gpt-oss-20b:free',
}

// NVIDIA NIM direct models — verified free-tier endpoints
const NVIDIA_MODELS = {
  general:   'meta/llama-3.1-8b-instruct',
  reasoning: 'nvidia/llama-3.3-nemotron-super-49b-v1',
  mistral:   'mistralai/mistral-nemotron',
  small:     'google/gemma-2-2b-it',
}

// ─── HuggingFace ───────────────────────────────────────────────────────────

export async function hfClassify(
  text: string,
  model = 'distilbert/distilbert-base-uncased-finetuned-sst-2-english'
): Promise<{ label: string; score: number }[]> {
  const res = await fetch(`${HF_BASE}/${model}/pipeline/text-classification`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HF_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text }),
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new Error(`HF ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return (Array.isArray(data[0]) ? data[0] : data) as { label: string; score: number }[]
}

export async function hfZeroShot(
  text: string,
  labels: string[],
  model = 'facebook/bart-large-mnli'
): Promise<{ labels: string[]; scores: number[] }> {
  const res = await fetch(`${HF_BASE}/${model}/pipeline/zero-shot-classification`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HF_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text, parameters: { candidate_labels: labels } }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`HF ${res.status}: ${await res.text()}`)
  return res.json()
}

// ─── Mistral ───────────────────────────────────────────────────────────────

type ChatMsg = { role: 'user' | 'assistant' | 'system'; content: string }

export async function mistralChat(
  messages: ChatMsg[],
  opts: { model?: string; maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const res = await fetch(`${MISTRAL_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${MISTRAL_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model ?? MODELS.reasoning,
      messages,
      max_tokens: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.3,
    }),
  })
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${await res.text()}`)
  const d = await res.json()
  return d.choices[0].message.content as string
}

// ─── NVIDIA NIM (direct) ───────────────────────────────────────────────────

export async function nvidiaChat(
  messages: ChatMsg[],
  opts: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${NVIDIA_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model ?? NVIDIA_MODELS.general,
      messages,
      max_tokens: opts.maxTokens ?? 512,
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`NVIDIA ${res.status}: ${await res.text()}`)
  const d = await res.json()
  if (d.error) throw new Error(`NVIDIA error: ${JSON.stringify(d.error)}`)
  return d.choices[0].message.content as string
}

// ─── OpenRouter (dual-key rotation, model fallback, NVIDIA + Mistral last resort) ──
//
// Chain: OR key #1 (primary model) → OR key #2 (primary model) →
//        OR key #1 (fallback model, if provided) → OR key #2 (fallback model) →
//        NVIDIA NIM direct → Mistral (final safety net)
//
// Grok_Api_Key exists in secrets but the account has no credits/licenses
// (403 permission-denied on every model as of 2026-07-09) — excluded from
// routing until credits are added. See .agents/memory/ai-providers.md.

async function orAttempt(
  key: string,
  model: string,
  messages: ChatMsg[],
  maxTokens: number
): Promise<string> {
  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://questhub.io',
      'X-Title': 'QuestHub Guild',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`OR ${res.status}: ${await res.text()}`)
  const d = await res.json()
  if (d.error) throw new Error(`OR error: ${JSON.stringify(d.error)}`)
  return d.choices[0].message.content as string
}

export async function openRouterChat(
  messages: ChatMsg[],
  opts: {
    model?: string
    fallbackModel?: string
    maxTokens?: number
    fallbackToMistral?: boolean
    nvidiaModel?: string
  } = {}
): Promise<string> {
  const maxTokens = opts.maxTokens ?? 512
  const models = [opts.model ?? MODELS.router, opts.fallbackModel].filter(Boolean) as string[]
  const keys = OR_KEYS()

  for (const model of models) {
    for (const key of keys) {
      try {
        return await orAttempt(key, model, messages, maxTokens)
      } catch {
        // try next key / model combo
      }
    }
  }

  try {
    return await nvidiaChat(messages, { model: opts.nvidiaModel ?? NVIDIA_MODELS.general, maxTokens })
  } catch {
    // fall through to Mistral
  }

  if (opts.fallbackToMistral !== false) {
    return mistralChat(messages, { maxTokens })
  }
  throw new Error('All AI providers failed (OpenRouter x2 keys, NVIDIA, Mistral)')
}

// ─── Risk Engine (replaces Grok — Grok account has no credits) ────────────

export async function riskAnalysis(
  messages: ChatMsg[],
  opts: { maxTokens?: number } = {}
): Promise<string> {
  return openRouterChat(messages, {
    model: MODELS.risk,
    fallbackModel: MODELS.riskFree,
    nvidiaModel: NVIDIA_MODELS.small,
    maxTokens: opts.maxTokens ?? 512,
    fallbackToMistral: true,
  })
}

// ─── Deep Analysis Engine (replaces Gemini) ────────────────────────────────

export async function deepAnalysis(
  prompt: string,
  opts: { maxTokens?: number } = {}
): Promise<string> {
  return openRouterChat(
    [{ role: 'user', content: prompt }],
    {
      model: MODELS.deep,
      fallbackModel: MODELS.deepFree,
      nvidiaModel: NVIDIA_MODELS.reasoning,
      maxTokens: opts.maxTokens ?? 1024,
      fallbackToMistral: true,
    }
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HIGH-LEVEL TASK HELPERS
// ═══════════════════════════════════════════════════════════════════════════

// ─── MESSAGE MODERATION PIPELINE ──────────────────────────────────────────

export async function moderateMessage(text: string): Promise<{
  safe: boolean
  toxicityScore: number
  stage: string
  reason: string | null
  notifyFounder: boolean
}> {
  let toxicityScore = 0
  try {
    const [top] = await hfClassify(text)
    toxicityScore = top.label === 'NEGATIVE' ? top.score : 1 - top.score
  } catch {
    toxicityScore = 0.1
  }

  if (toxicityScore < 0.55) {
    return { safe: true, toxicityScore, stage: 'HF', reason: null, notifyFounder: false }
  }

  let safetyFlag = false
  try {
    const safetyResult = await openRouterChat([
      {
        role: 'system',
        content: 'You are a content-safety classifier. Classify the message as safe or unsafe (harassment, scam, contact-info sharing, exploitation). Reply JSON: { "unsafe": boolean, "category": string | null }',
      },
      { role: 'user', content: `Message: "${text}"` },
    ], {
      model: MODELS.moderation,
      fallbackModel: MODELS.moderationFallback,
      maxTokens: 80,
      fallbackToMistral: false,
    })
    const m = safetyResult.match(/\{[\s\S]*?\}/)
    if (m) safetyFlag = JSON.parse(m[0]).unsafe === true
  } catch { /* purpose-built safety model unavailable, continue to risk stage */ }

  let patternFlag = safetyFlag
  try {
    const riskResult = await riskAnalysis([
      {
        role: 'system',
        content: 'You are a guild message safety system. Detect: contact-info sharing (phone/email/social handles), client theft attempts, scam patterns, or harassment. Reply JSON: { "flagged": boolean, "reason": string | null }',
      },
      { role: 'user', content: `Message: "${text}"` },
    ], { maxTokens: 120 })
    const m = riskResult.match(/\{[\s\S]*?\}/)
    if (m) {
      const parsed = JSON.parse(m[0])
      patternFlag = patternFlag || parsed.flagged
    }
  } catch { /* ignore, continue to stage 3 */ }

  if (toxicityScore < 0.75 && !patternFlag) {
    return { safe: false, toxicityScore, stage: 'Risk', reason: 'Flagged for review', notifyFounder: false }
  }

  try {
    const severity = await mistralChat([
      {
        role: 'system',
        content: 'You are a content safety judge. Evaluate message severity and whether the guild founder needs immediate notification. Reply JSON: { "reason": string, "notifyFounder": boolean }',
      },
      { role: 'user', content: `Message: "${text}"` },
    ], { maxTokens: 150 })
    const m = severity.match(/\{[\s\S]*?\}/)
    if (m) {
      const parsed = JSON.parse(m[0])
      return { safe: false, toxicityScore, stage: 'Mistral', reason: parsed.reason, notifyFounder: parsed.notifyFounder }
    }
  } catch {}

  return { safe: false, toxicityScore, stage: 'Mistral', reason: 'Severe content detected', notifyFounder: true }
}

// ─── TRIAL EVALUATION ─────────────────────────────────────────────────────

export async function evaluateTrial(trial: {
  strengths: string
  whyJoin: string
  skills: string[]
  availability: string
  age?: number
}): Promise<{
  score: number
  summary: string
  recommendation: 'ACCEPT' | 'REVIEW' | 'REJECT'
  strengths: string[]
  concerns: string[]
}> {
  const prompt = `Evaluate this QuestHub guild applicant on a scale of 0-100. Be honest and strict — only accept genuinely promising candidates.

Age: ${trial.age ?? 'not provided'}
Skills: ${trial.skills.join(', ')}
Strengths (self-described): ${trial.strengths}
Why they want to join: ${trial.whyJoin}
Availability: ${trial.availability}

Score criteria:
- 80-100: Clear talent, strong motivation → ACCEPT
- 50-79: Potential but needs proving → REVIEW
- 0-49: Not ready or low effort application → REJECT

Reply ONLY with JSON: { "score": number, "summary": string, "recommendation": "ACCEPT"|"REVIEW"|"REJECT", "strengths": string[], "concerns": string[] }`

  try {
    const raw = await openRouterChat([{ role: 'user', content: prompt }], {
      model: MODELS.cot,
      fallbackModel: MODELS.deepFree,
      nvidiaModel: NVIDIA_MODELS.reasoning,
      maxTokens: 400,
      fallbackToMistral: true,
    })
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
  } catch {}

  return {
    score: 50,
    summary: 'Unable to complete AI evaluation. Manual review required.',
    recommendation: 'REVIEW',
    strengths: [],
    concerns: ['AI evaluation failed — review manually'],
  }
}

// ─── FOUNDER-ASSISTED TRIAL DRAFTING ──────────────────────────────────────
// Turns the founder's rough scouting notes into a clean application draft

export async function draftTrialFromNotes(input: {
  rawNotes: string
  skills: string[]
  availability?: string
}): Promise<{ strengths: string; whyJoin: string; availability: string }> {
  const prompt = `A guild founder is manually recruiting a talented teen and jotted down rough notes. Turn these into a clean, first-person application draft as if the applicant wrote it.

Founder's notes: ${input.rawNotes}
Skills: ${input.skills.join(', ')}
Availability (if known): ${input.availability ?? 'not specified — infer something reasonable'}

Reply ONLY with JSON: { "strengths": string, "whyJoin": string, "availability": string }
Each field 1-3 sentences, grounded only in the notes given — don't invent claims they don't support.`

  try {
    const raw = await mistralChat([{ role: 'user', content: prompt }], { maxTokens: 300 })
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
  } catch {}

  return {
    strengths: input.rawNotes,
    whyJoin: 'Recruited directly by the founder.',
    availability: input.availability ?? 'Not specified',
  }
}

// ─── TRUST SCORE ENGINE ────────────────────────────────────────────────────

export const TRUST_EVENTS: Record<string, number> = {
  QUEST_COMPLETED:     +8,
  QUEST_APPROVED:      +10,
  QUEST_LATE:          -5,
  QUEST_ABANDONED:     -12,
  TRIAL_ACCEPTED:      +15,
  MESSAGE_FLAGGED:     -10,
  MESSAGE_SEVERE:      -20,
  WARNING_ISSUED:      -15,
  RANK_UP:             +10,
  ACHIEVEMENT_EARNED:  +5,
  REPORT_MADE:         -8,
  REPORT_DISMISSED:    +3,
  DAILY_ACTIVE:        +1,
  VERIFICATION_EMAIL:  +5,
  VERIFICATION_SOCIAL: +10,
  VERIFICATION_LOCATION: +15,
  VERIFICATION_FACE:   +20,
  VERIFICATION_ID:     +25,
}

export function computeTrustLevel(score: number): string {
  if (score >= 90) return 'ELITE'
  if (score >= 75) return 'TRUSTED'
  if (score >= 55) return 'RISING'
  if (score >= 35) return 'NEW'
  if (score >= 15) return 'WATCH'
  return 'RISK'
}

export function clampTrust(score: number): number {
  return Math.max(0, Math.min(100, score))
}

// ─── TRUST ANALYSIS (Risk Engine) ─────────────────────────────────────────

export async function analyzeTrustRisk(userSummary: {
  trustScore: number
  rank: string
  recentFlags: number
  questsCompleted: number
  questsAbandoned: number
  warningsCount: number
  daysActive: number
}): Promise<{
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  flags: string[]
  recommendation: string
}> {
  const prompt = `Analyze this guild member's trust risk profile.

Trust Score: ${userSummary.trustScore}/100
Rank: ${userSummary.rank}
Recent content flags: ${userSummary.recentFlags}
Quests completed: ${userSummary.questsCompleted}
Quests abandoned: ${userSummary.questsAbandoned}
Warnings: ${userSummary.warningsCount}
Days active: ${userSummary.daysActive}

Reply JSON: { "riskLevel": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "flags": string[], "recommendation": string }`

  try {
    const raw = await riskAnalysis([{ role: 'user', content: prompt }], { maxTokens: 250 })
    const m = raw.match(/\{[\s\S]*?\}/)
    if (m) return JSON.parse(m[0])
  } catch {}

  const riskLevel = userSummary.trustScore < 20 ? 'CRITICAL'
    : userSummary.trustScore < 35 ? 'HIGH'
    : userSummary.trustScore < 55 ? 'MEDIUM' : 'LOW'

  return { riskLevel, flags: [], recommendation: 'Manual review recommended' }
}

// ─── QUEST MATCHING ────────────────────────────────────────────────────────

export async function matchQuests(
  member: { rank: string; skills: string[]; xp: number; trustScore: number },
  quests: { id: string; title: string; category: string; difficulty: string }[]
): Promise<string[]> {
  if (!quests.length) return []

  const prompt = `Rank these guild quests for a member: Rank ${member.rank}, Skills [${member.skills.join(', ')}], ${member.xp} XP, Trust ${member.trustScore}/100.
Quests:
${quests.map(q => `[${q.id}] ${q.title} (${q.category}, ${q.difficulty})`).join('\n')}

Return ONLY a JSON array of IDs ordered best to worst fit.`

  try {
    const raw = await openRouterChat([{ role: 'user', content: prompt }], { maxTokens: 200 })
    const m = raw.match(/\[[\s\S]*?\]/)
    if (m) return JSON.parse(m[0])
  } catch {}

  return quests.map(q => q.id)
}

// ─── ACHIEVEMENT AUTO-ASSIGN ───────────────────────────────────────────────

export async function checkAchievements(userStats: {
  userId: string
  rank: string
  xp: number
  questsCompleted: number
  trustScore: number
  daysActive: number
  existingAchievements: string[]
}, allAchievements: { id: string; name: string; condition: string }[]): Promise<string[]> {
  if (!allAchievements.length) return []

  const eligible = allAchievements.filter(a => !userStats.existingAchievements.includes(a.id))
  if (!eligible.length) return []

  const prompt = `A guild member has: Rank ${userStats.rank}, ${userStats.xp} XP, ${userStats.questsCompleted} quests done, Trust ${userStats.trustScore}/100, ${userStats.daysActive} days active.

Which of these achievements should they receive?
${eligible.map(a => `[${a.id}] ${a.name}: ${a.condition}`).join('\n')}

Return ONLY a JSON array of earned achievement IDs. Empty array if none.`

  try {
    const raw = await openRouterChat([{ role: 'user', content: prompt }], {
      model: MODELS.router,
      fallbackModel: MODELS.routerFallback,
      nvidiaModel: NVIDIA_MODELS.general,
      maxTokens: 150,
      fallbackToMistral: true,
    })
    const m = raw.match(/\[[\s\S]*?\]/)
    if (m) return JSON.parse(m[0])
  } catch {}

  return []
}

// ─── SUBMISSION SHIELD ─────────────────────────────────────────────────────

export async function reviewSubmission(submission: {
  questTitle: string
  instructions: string
  submissionNote: string
  submissionUrl?: string
}): Promise<{
  pass: boolean
  score: number
  feedback: string
  issues: string[]
}> {
  const prompt = `Review this quest submission for the QuestHub guild.

Quest: ${submission.questTitle}
Instructions: ${submission.instructions}
Member's note: ${submission.submissionNote}
Link: ${submission.submissionUrl ?? 'not provided'}

Score 0-100 on: relevance, quality, completeness, effort.
Reply JSON: { "pass": boolean, "score": number, "feedback": string, "issues": string[] }`

  try {
    const raw = await deepAnalysis(prompt, { maxTokens: 400 })
    const m = raw.match(/\{[\s\S]*?\}/)
    if (m) return JSON.parse(m[0])
  } catch {}

  return { pass: true, score: 70, feedback: 'AI review unavailable — manual review required', issues: [] }
}

// ─── ADMIN RECOMMENDATION ──────────────────────────────────────────────────

export async function generateAdminRec(context: {
  type: 'USER_RISK' | 'TRIAL_DECISION' | 'QUEST_DISPUTE' | 'PAYOUT_FLAG'
  details: string
}): Promise<{ action: string; reasoning: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' }> {
  const prompt = `You are an AI advisor for the QuestHub guild admin team.

Situation type: ${context.type}
Details: ${context.details}

Provide a clear, actionable recommendation.
Reply JSON: { "action": string, "reasoning": string, "priority": "LOW"|"MEDIUM"|"HIGH" }`

  try {
    const raw = await openRouterChat([{ role: 'user', content: prompt }], {
      model: MODELS.cot,
      fallbackModel: MODELS.deepFree,
      nvidiaModel: NVIDIA_MODELS.reasoning,
      maxTokens: 300,
      fallbackToMistral: true,
    })
    const m = raw.match(/\{[\s\S]*?\}/)
    if (m) return JSON.parse(m[0])
  } catch {}

  return { action: 'Manual review required', reasoning: 'AI advisor unavailable', priority: 'MEDIUM' }
}

// ─── FEEDBACK TRIAGE ────────────────────────────────────────────────────────

export async function triageFeedback(feedback: {
  message: string
  category?: string
}): Promise<{
  category: 'BUG' | 'FEATURE_REQUEST' | 'PRAISE' | 'COMPLAINT' | 'OTHER'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  toxic: boolean
  summary: string
}> {
  let toxic = false
  try {
    const mod = await moderateMessage(feedback.message)
    toxic = !mod.safe
  } catch {}

  const prompt = `Triage this user feedback for a guild platform admin.

Feedback: "${feedback.message}"

Reply JSON: { "category": "BUG"|"FEATURE_REQUEST"|"PRAISE"|"COMPLAINT"|"OTHER", "priority": "LOW"|"MEDIUM"|"HIGH", "summary": string (one sentence) }`

  try {
    const raw = await openRouterChat([{ role: 'user', content: prompt }], {
      model: MODELS.router,
      fallbackModel: MODELS.routerFallback,
      nvidiaModel: NVIDIA_MODELS.general,
      maxTokens: 150,
      fallbackToMistral: true,
    })
    const m = raw.match(/\{[\s\S]*?\}/)
    if (m) {
      const parsed = JSON.parse(m[0])
      return { ...parsed, toxic }
    }
  } catch {}

  return { category: 'OTHER', priority: 'MEDIUM', toxic, summary: feedback.message.slice(0, 120) }
}

// ─── QUEST SUGGESTION REVIEW ────────────────────────────────────────────────

export async function reviewQuestSuggestion(suggestion: {
  title: string
  description: string
  category?: string
}): Promise<{ relevanceScore: number; feedback: string; recommend: boolean }> {
  const prompt = `A guild member suggested a new quest idea. Evaluate it for relevance and quality.

Title: ${suggestion.title}
Description: ${suggestion.description}
Category: ${suggestion.category ?? 'not specified'}

Reply JSON: { "relevanceScore": number (0-100), "feedback": string, "recommend": boolean }`

  try {
    const raw = await openRouterChat([{ role: 'user', content: prompt }], {
      model: MODELS.router,
      fallbackModel: MODELS.routerFallback,
      nvidiaModel: NVIDIA_MODELS.general,
      maxTokens: 200,
      fallbackToMistral: true,
    })
    const m = raw.match(/\{[\s\S]*?\}/)
    if (m) return JSON.parse(m[0])
  } catch {}

  return { relevanceScore: 50, feedback: 'AI review unavailable — manual review required', recommend: true }
}
// ─── ARENA PROTOCOL: AI Game Validator Layer ───────────────────────────────

export async function validateArenaEntry(input: {
  gameTitle: string
  category: string
  objective: string
  validationType: 'auto' | 'manual' | 'hybrid'
  content: string
}): Promise<{ score: number; feedback: string; flagged: boolean }> {
  if (input.validationType === 'manual') {
    return { score: 0, feedback: 'Pending manual review', flagged: false }
  }

  const prompt = `You are the ARENA PROTOCOL AI validator for a competitive guild mini-game.

Game: ${input.gameTitle}
Category: ${input.category}
Objective: ${input.objective}
Submitted entry: ${input.content}

Score the entry 0-100 on relevance, effort, and creativity. Flag it if it looks like spam, a copy-paste cheat, or unrelated content.
Reply JSON: { "score": number, "feedback": string, "flagged": boolean }`

  try {
    const raw = await deepAnalysis(prompt, { maxTokens: 300 })
    const m = raw.match(/\{[\s\S]*?\}/)
    if (m) return JSON.parse(m[0])
  } catch {}

  return { score: 50, feedback: 'AI validator unavailable — scored as neutral, admin can override.', flagged: false }
}

export async function generateArenaPrompt(category: string, difficulty: string): Promise<{
  prompt: string
  answer?: string
}> {
  const req = `Generate one short, fresh ${difficulty}-difficulty "${category}" mini-game prompt/question for a competitive tech guild's Arena Protocol.
Keep it punchy (max 2 sentences). If it has a single objectively correct answer, include it.
Reply JSON: { "prompt": string, "answer": string|null }`

  try {
    const raw = await openRouterChat([{ role: 'user', content: req }], {
      model: MODELS.router,
      fallbackModel: MODELS.routerFallback,
      nvidiaModel: NVIDIA_MODELS.general,
      maxTokens: 200,
      fallbackToMistral: true,
    })
    const m = raw.match(/\{[\s\S]*?\}/)
    if (m) return JSON.parse(m[0])
  } catch {}

  return { prompt: `Give your best ${category.toLowerCase()} answer under pressure!`, answer: undefined }
}

// ─── GHOST PROTOCOL: Community Party Games ─────────────────────────────────

export async function generateGhostProtocolContent(
  gameType: 'TRUTH_DARE' | 'WOULD_RATHER' | 'TWO_TRUTHS' | 'WORD_CHAIN' | 'GUILD_TRIVIA',
  extra?: string
): Promise<any> {
  const prompts: Record<string, string> = {
    TRUTH_DARE: `Generate ONE fun, guild-appropriate "truth or dare" style prompt for a tech guild chat game — either a deep/funny question or a light harmless dare. Keep it workplace-safe.
Reply JSON: { "mode": "truth"|"dare", "prompt": string }`,
    WOULD_RATHER: `Generate ONE "would you rather" dilemma with two extreme, funny tech/career options for a guild chat game.
Reply JSON: { "optionA": string, "optionB": string }`,
    GUILD_TRIVIA: `Generate 5 rapid-fire multiple choice trivia questions about coding, tech history, or internet culture, for a guild chat game. Keep questions short.
Reply JSON: { "questions": [ { "question": string, "options": string[4], "correctIndex": number } ] }`,
    WORD_CHAIN: `Generate a fun starting word (6-10 letters, common English noun) to kick off a word-chain game.
Reply JSON: { "startWord": string }`,
    TWO_TRUTHS: `no-op`,
  }

  if (gameType === 'TWO_TRUTHS') {
    // User-submitted content, not AI-generated — validated separately.
    return {}
  }

  try {
    const raw = await openRouterChat([{ role: 'user', content: prompts[gameType] }], {
      model: MODELS.router,
      fallbackModel: MODELS.routerFallback,
      nvidiaModel: NVIDIA_MODELS.general,
      maxTokens: 500,
      fallbackToMistral: true,
    })
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
  } catch {}

  const fallback: Record<string, any> = {
    TRUTH_DARE: { mode: 'truth', prompt: "What's the most useless skill you're weirdly proud of?" },
    WOULD_RATHER: { optionA: 'Debug legacy code with no comments forever', optionB: 'Attend daily stand-ups at 5AM forever' },
    GUILD_TRIVIA: {
      questions: [
        { question: 'What does "HTTP" stand for?', options: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'Host Transfer Text Program', 'HyperText Text Protocol'], correctIndex: 0 },
      ],
    },
    WORD_CHAIN: { startWord: 'dragon' },
  }
  return fallback[gameType] ?? {}
}

export async function judgeTwoTruthsGuess(statements: string[], lieIndex: number): Promise<string> {
  const prompt = `A guild member played "Two Truths and a Lie". Their statements were:
1. ${statements[0]}
2. ${statements[1]}
3. ${statements[2]}
The lie was statement #${lieIndex + 1}. Write one short, dramatic reveal line (max 20 words) announcing the lie to the chat.`
  try {
    return await openRouterChat([{ role: 'user', content: prompt }], {
      model: MODELS.router,
      fallbackModel: MODELS.routerFallback,
      maxTokens: 60,
      fallbackToMistral: true,
    })
  } catch {
    return `The truth is out — statement #${lieIndex + 1} was the lie all along!`
  }
}
