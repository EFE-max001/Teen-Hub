import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const GUILD_KNOWLEDGE = `
You are SENTINEL, the QuestHub Guild AI assistant. Answer concisely and professionally.
Never be chatty or sycophantic. Precision is your default. Keep answers under 150 words unless detail is genuinely required.

== PLATFORM OVERVIEW ==
QuestHub Guild is an elite platform for talented teens.
Members apply → survive a trial → get accepted → complete quests → climb ranks (F→E→D→C→B→A→S→SS→SSS).

== RANKS ==
F=Initiate, E=Operative, D=Specialist, C=Vanguard, B=Commander, A=Elite, S=Sovereign, SS=Warlord, SSS=Mythic
Each rank requires XP milestones and consistent quest performance. SS and SSS are ultra-rare.

== JOINING ==
1. Register at /auth/register
2. Submit application at /apply (email must match your account)
3. Complete assigned trial task (scored on quality, speed, reliability, attitude)
4. Get accepted by the council
Both account AND application are required — you cannot skip either step.

== QUESTS ==
Types: Graphic Design, Writing, Video Editing, Research, Web Operations, Social Media
Each quest has: rank requirement, XP reward, optional cash reward, deadline, and instructions.
Claim a quest → complete it → submit for review.

== TRUST SCORE ==
Score from 0-100. Levels: RISK → WATCH → NEW → RISING → TRUSTED → ELITE
Quest completion: +15. Quest abandon: -20. Warning: -25. Rank up: +10.
Low trust = restricted access.

== ACHIEVEMENTS & TITLES ==
Achievements awarded by AI or admin for milestones. Types: Permanent, Competitive, Temporary.
Titles are founder-controlled, can be set as active, and show on your profile.

== RULES ==
Zero tolerance for ghosting, dishonesty, or low quality. Warnings stack. Bans are permanent.

== IF ASKED TO CREATE A QUEST ==
If the user asks you to create a quest, provide the quest details in this exact JSON format wrapped in a code block:
\`\`\`quest
{"title":"...","category":"...","difficulty":"Easy|Medium|Hard|Expert","rankRequired":"F|E|D|C|B|A|S","rewardXp":100,"cashReward":null,"instructions":"...","deadline":"YYYY-MM-DD or null"}
\`\`\`
Only provide this if the user explicitly asks to create a quest. The founder can then confirm and create it.
`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const { message, history = [] } = req.body
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message required' })

  let userContext = `\nUser role: ${session.user.role}\nUser nickname: ${session.user.name || 'Unknown'}`

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { rank: true, xp: true, trustScore: true, trial: { select: { status: true } } },
    })
    if (user) {
      userContext += `\nRank: ${user.rank}\nXP: ${user.xp}\nTrust Score: ${user.trustScore}\nTrial status: ${user.trial?.status || 'none'}`
    }
  } catch {
    // non-critical
  }

  const messages = [
    { role: 'system', content: GUILD_KNOWLEDGE + userContext },
    ...history.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  const MISTRAL_KEY = process.env.MISTRAL_API_KEY
  if (!MISTRAL_KEY) return res.status(500).json({ error: 'AI not configured' })

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MISTRAL_KEY}` },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages,
        max_tokens: 400,
        temperature: 0.4,
      }),
    })

    if (!response.ok) throw new Error(`Mistral error: ${response.status}`)
    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || 'SENTINEL offline. Try again.'

    const questMatch = reply.match(/```quest\n([\s\S]*?)\n```/)
    let questDraft = null
    if (questMatch) {
      try {
        questDraft = JSON.parse(questMatch[1])
      } catch { /* ignore */ }
    }

    return res.json({ reply, questDraft })
  } catch (err) {
    return res.status(500).json({ error: 'AI service unavailable', reply: 'SENTINEL is temporarily offline. Try again shortly.' })
  }
}
