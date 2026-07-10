import { prisma } from '@/lib/prisma'
import { generateGhostProtocolContent, judgeTwoTruthsGuess } from '@/lib/ai'

// GHOST PROTOCOL — real-time community party games playable via slash commands in chat.
// Scope (per product decision): Truth or Dare, Would You Rather, Two Truths and a Lie.

export const GHOST_COMMANDS = ['/party', '/truth', '/dare', '/wyr', '/ttal', '/guess', '/endgame', '/help-party'] as const

export interface GhostCommandResult {
  handled: boolean
  systemContent?: string
  error?: string
}

function fmt(gameType: string) {
  return gameType === 'TRUTH_DARE' ? 'Truth or Dare' : gameType === 'WOULD_RATHER' ? 'Would You Rather' : 'Two Truths and a Lie'
}

async function getActiveSession(channel: string) {
  return prisma.chatGameSession.findFirst({
    where: { channel, status: 'IN_PROGRESS' },
    orderBy: { createdAt: 'desc' },
  })
}

export async function handleGhostCommand(
  channel: string,
  userId: string,
  userLabel: string,
  rawContent: string
): Promise<GhostCommandResult> {
  const content = rawContent.trim()
  if (!content.startsWith('/')) return { handled: false }

  const [cmdRaw, ...rest] = content.split(/\s+/)
  const cmd = cmdRaw.toLowerCase()
  const argsStr = content.slice(cmdRaw.length).trim()

  if (cmd === '/help-party') {
    return {
      handled: true,
      systemContent: `👻 GHOST PROTOCOL — party game commands:\n` +
        `/party truth-or-dare — start Truth or Dare\n` +
        `/party would-you-rather — start Would You Rather\n` +
        `/party two-truths <fact 1> | <fact 2> | <fact 3> — start Two Truths and a Lie (last one before "|" pattern is up to you, just make ONE of the three false)\n` +
        `/truth or /dare — respond in a Truth or Dare round\n` +
        `/guess <1|2|3> — guess the lie in an active Two Truths round\n` +
        `/endgame — end the active party game in this channel`,
    }
  }

  if (cmd === '/endgame') {
    const active = await getActiveSession(channel)
    if (!active) return { handled: true, error: 'No active party game in this channel.' }
    await prisma.chatGameSession.update({ where: { id: active.id }, data: { status: 'FINISHED' } })
    return { handled: true, systemContent: `👻 ${fmt(active.gameType)} session ended by ${userLabel}.` }
  }

  if (cmd === '/party') {
    const existing = await getActiveSession(channel)
    if (existing) return { handled: true, error: `A ${fmt(existing.gameType)} game is already running in this channel. Use /endgame to stop it first.` }

    const mode = rest[0]?.toLowerCase()

    if (mode === 'truth-or-dare' || mode === 'tod') {
      const round = await generateGhostProtocolContent('TRUTH_DARE')
      await prisma.chatGameSession.create({
        data: { channel, gameType: 'TRUTH_DARE', startedById: userId, state: { round: 1, current: round } },
      })
      return {
        handled: true,
        systemContent: `👻 GHOST PROTOCOL: ${userLabel} started Truth or Dare!\n🎯 ${round.mode.toUpperCase()}: ${round.prompt}\nAnyone can answer, or type /truth or /dare for a fresh prompt.`,
      }
    }

    if (mode === 'would-you-rather' || mode === 'wyr') {
      const round = await generateGhostProtocolContent('WOULD_RATHER')
      await prisma.chatGameSession.create({
        data: { channel, gameType: 'WOULD_RATHER', startedById: userId, state: { round: 1, current: round } },
      })
      return {
        handled: true,
        systemContent: `👻 GHOST PROTOCOL: ${userLabel} started Would You Rather!\nA) ${round.optionA}\nB) ${round.optionB}\nReply in chat with A or B!`,
      }
    }

    if (mode === 'two-truths' || mode === 'ttal') {
      const statements = argsStr.split(/\s+/).slice(1).join(' ').split('|').map(s => s.trim()).filter(Boolean)
      if (statements.length !== 3) {
        return { handled: true, error: 'Usage: /party two-truths <fact 1> | <fact 2> | <fact 3> (exactly 3 statements, one false)' }
      }
      await prisma.chatGameSession.create({
        data: { channel, gameType: 'TWO_TRUTHS', startedById: userId, state: { statements, guesses: {} } },
      })
      return {
        handled: true,
        systemContent: `👻 GHOST PROTOCOL: ${userLabel} played Two Truths and a Lie!\n1. ${statements[0]}\n2. ${statements[1]}\n3. ${statements[2]}\nGuess the lie with /guess 1, /guess 2, or /guess 3!`,
      }
    }

    return { handled: true, error: 'Usage: /party truth-or-dare | would-you-rather | two-truths <a> | <b> | <c>' }
  }

  if (cmd === '/truth' || cmd === '/dare') {
    const active = await getActiveSession(channel)
    if (!active || active.gameType !== 'TRUTH_DARE') {
      return { handled: true, error: 'No active Truth or Dare game. Start one with /party truth-or-dare' }
    }
    const mode = cmd === '/truth' ? 'truth' : 'dare'
    const round = await generateGhostProtocolContent('TRUTH_DARE', mode)
    const state: any = active.state
    await prisma.chatGameSession.update({
      where: { id: active.id },
      data: { state: { round: (state.round || 1) + 1, current: round } },
    })
    return { handled: true, systemContent: `🎯 ${userLabel} drew a ${round.mode.toUpperCase()}: ${round.prompt}` }
  }

  if (cmd === '/wyr') {
    const active = await getActiveSession(channel)
    if (!active || active.gameType !== 'WOULD_RATHER') {
      return { handled: true, error: 'No active Would You Rather game. Start one with /party would-you-rather' }
    }
    const round = await generateGhostProtocolContent('WOULD_RATHER')
    const state: any = active.state
    await prisma.chatGameSession.update({
      where: { id: active.id },
      data: { state: { round: (state.round || 1) + 1, current: round } },
    })
    return { handled: true, systemContent: `⚖️ Next round!\nA) ${round.optionA}\nB) ${round.optionB}` }
  }

  if (cmd === '/guess') {
    const active = await getActiveSession(channel)
    if (!active || active.gameType !== 'TWO_TRUTHS') {
      return { handled: true, error: 'No active Two Truths and a Lie game.' }
    }
    const guess = parseInt(rest[0])
    if (![1, 2, 3].includes(guess)) return { handled: true, error: 'Usage: /guess 1, /guess 2, or /guess 3' }

    const state: any = active.state
    if (state.guesses?.[userId]) return { handled: true, error: "You've already guessed this round." }

    const newGuesses = { ...(state.guesses || {}), [userId]: guess }
    await prisma.chatGameSession.update({ where: { id: active.id }, data: { state: { ...state, guesses: newGuesses } } })

    return { handled: true, systemContent: `🕵️ ${userLabel} locked in a guess for the lie.` }
  }

  return { handled: false }
}

export async function revealTwoTruthsIfHost(channel: string, userId: string): Promise<string | null> {
  const active = await getActiveSession(channel)
  if (!active || active.gameType !== 'TWO_TRUTHS' || active.startedById !== userId) return null
  const state: any = active.state
  const lieIndex = Math.floor(Math.random() * 3)
  const reveal = await judgeTwoTruthsGuess(state.statements, lieIndex)
  await prisma.chatGameSession.update({ where: { id: active.id }, data: { status: 'FINISHED' } })
  return `👻 ${reveal}`
}
