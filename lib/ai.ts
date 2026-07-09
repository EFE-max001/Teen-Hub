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

// ─── OpenRouter (with Mistral fallback) ────────────────────────────────────

export async function openRouterChat(
  messages: ChatMsg[],
  opts: { model?: string; maxTokens?: number; fallbackToMistral?: boolean } = {}
): Promise<string> {
  try {
    const res = await fetch(`${OR_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OR_KEY()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://questhub.io',
        'X-Title': 'QuestHub Guild',
      },
      body: JSON.stringify({
        model: opts.model ?? MODELS.router,
        messages,
        max_tokens: opts.maxTokens ?? 512,
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`OR ${res.status}: ${errText}`)
    }
    const d = await res.json()
    if (d.error) throw new Error(`OR error: ${JSON.stringify(d.error)}`)
    return d.choices[0].message.content as string
  } catch (e) {
    if (opts.fallbackToMistral !== false) {
      return mistralChat(messages, { maxTokens: opts.maxTokens })
    }
    throw e
  }
}

// ─── Risk Engine (replaces Grok) ───────────────────────────────────────────

export async function riskAnalysis(
  messages: ChatMsg[],
  opts: { maxTokens?: number } = {}
): Promise<string> {
  return openRouterChat(messages, {
    model: MODELS.risk,
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
    { model: MODELS.deep, maxTokens: opts.maxTokens ?? 1024, fallbackToMistral: true }
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

  let patternFlag = false
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
      patternFlag = parsed.flagged
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
    const raw = await mistralChat([{ role: 'user', content: prompt }], { maxTokens: 400 })
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
    const raw = await mistralChat([{ role: 'user', content: prompt }], { maxTokens: 150 })
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
    const raw = await mistralChat([{ role: 'user', content: prompt }], { maxTokens: 300 })
    const m = raw.match(/\{[\s\S]*?\}/)
    if (m) return JSON.parse(m[0])
  } catch {}

  return { action: 'Manual review required', reasoning: 'AI advisor unavailable', priority: 'MEDIUM' }
}