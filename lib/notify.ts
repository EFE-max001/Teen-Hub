import { prisma } from '@/lib/prisma'

export async function notify(
  userId: string,
  type: string,
  title: string,
  body?: string | null,
  link?: string | null
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body: body || null, link: link || null },
    })
  } catch (err) {
    // Notifications are a nice-to-have — never let a failure here break
    // the action that triggered it (quest approval, trial decision, etc.)
    console.error('[notify] failed to create notification:', err)
  }
}