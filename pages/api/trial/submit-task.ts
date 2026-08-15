// Teen-Hub/pages/api/trial/submit-task.ts
//
// Previously there was no endpoint for this at all — pages/dashboard/trial.tsx
// rendered the assigned TrialTask as a plain read-only card with no form,
// and the Trial model had nowhere to store submitted work even if there had
// been one. This is what "can't even submit trial" was actually about.
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) return res.status(401).json({ error: 'Unauthorized' })
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { submissionUrl, submissionNote } = req.body || {}
    if (!submissionNote?.trim()) return res.status(400).json({ error: 'Describe what you completed before submitting.' })

    const trial = await prisma.trial.findUnique({
      where: { userId: session.user.id },
      include: { assignedTask: true },
    })
    if (!trial) return res.status(404).json({ error: 'No trial application found.' })
    if (!trial.assignedTaskId || !trial.assignedTask) return res.status(400).json({ error: 'No task has been assigned to you yet.' })
    if (!['PENDING', 'UNDER_REVIEW'].includes(trial.status)) {
      return res.status(400).json({ error: `Your trial is already ${trial.status.toLowerCase()} — nothing left to submit.` })
    }
    if (trial.taskSubmittedAt) {
      return res.status(400).json({ error: 'You have already submitted this task.' })
    }

    // Deadline enforcement — deadlineHours counts from when the task was
    // assigned (trial.submittedAt is when the application itself went in,
    // which is also effectively when the task became visible, since tasks
    // are assigned at application time in the current flow).
    const deadlineMs = trial.submittedAt.getTime() + trial.assignedTask.deadlineHours * 60 * 60 * 1000
    if (Date.now() > deadlineMs) {
      return res.status(400).json({ error: 'The deadline for this task has passed. Contact the Founder.' })
    }

    const updated = await prisma.trial.update({
      where: { id: trial.id },
      data: {
        taskSubmissionUrl: submissionUrl?.trim() || null,
        taskSubmissionNote: submissionNote.trim(),
        taskSubmittedAt: new Date(),
        status: 'UNDER_REVIEW',
      },
    })

    await prisma.activityLog.create({
      data: { userId: session.user.id, action: 'TRIAL_TASK_SUBMITTED', details: `Submitted trial task: ${trial.assignedTask.title}` },
    }).catch(() => {})

    return res.json({ trial: updated })
  } catch (err: any) {
    console.error('[trial/submit-task] failed:', err)
    return res.status(500).json({
      error: err?.message?.includes('Unknown arg') || err?.message?.includes('does not exist')
        ? `Prisma schema out of sync — run "npx prisma db push" and restart the server. (${err.message})`
        : (err?.message || 'Unexpected server error'),
    })
  }
}