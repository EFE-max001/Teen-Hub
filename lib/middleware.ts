import { getServerSession, Session } from 'next-auth'
import { authOptions } from './auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { GetServerSidePropsContext } from 'next'

const ROLE_LEVEL: Record<string, number> = {
  GUEST:           0,
  TRIAL_MEMBER:    1,
  ACCEPTED_MEMBER: 2,
  ACTIVE_WORKER:   3,
  MODERATOR:       4,
  COORDINATOR:     5,
  ADMIN:           6,
  FOUNDER:         7,
}

export function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[minRole] ?? 0)
}

export type RedirectResult = { redirect: { destination: string; permanent: boolean } }

export async function requireAuth(
  context: GetServerSidePropsContext,
  minRole: string = 'GUEST'
): Promise<RedirectResult | null> {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  if (!hasMinRole(session.user.role, minRole)) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }

  return null
}

export async function getAuthSession(
  context: GetServerSidePropsContext
): Promise<Session | null> {
  return getServerSession(context.req, context.res, authOptions)
}

export async function requireApiAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  minRole: string = 'GUEST'
): Promise<Session | null> {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  if (!hasMinRole(session.user.role, minRole)) {
    res.status(403).json({ error: 'Forbidden' })
    return null
  }
  return session
}
