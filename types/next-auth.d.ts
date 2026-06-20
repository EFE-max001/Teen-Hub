import { Role, Rank } from '@prisma/client'
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: Role
      rank: Rank
      xp: number
      nickname?: string | null
    }
  }

  interface User {
    role: Role
    rank: Rank
    xp: number
    nickname?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    rank: Rank
    xp: number
    nickname?: string | null
  }
}