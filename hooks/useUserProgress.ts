// Teen-Hub/hooks/useUserProgress.ts
// hooks/useUserProgress.ts
//
// "The World Evolves" from the redesign brief: as a member's rank climbs,
// the hero scene should visibly reflect it — more butterflies, brighter
// crystals, more roots — without any dedicated backend work, just reading
// the rank already present on the session.
import { useSession } from 'next-auth/react'

const RANK_LEVEL: Record<string, number> = {
  F: 0, E: 1, D: 2, C: 3, B: 4, A: 5, S: 6, SS: 7, SSS: 8,
}
const MAX_LEVEL = 8

// Returns 0 for guests/unranked visitors, scaling up to 1 at rank SSS.
export function useUserProgress(): number {
  const { data: session } = useSession()
  const rank = session?.user?.rank as string | undefined
  const level = rank && rank in RANK_LEVEL ? RANK_LEVEL[rank] : 0
  return Math.min(1, level / MAX_LEVEL)
}