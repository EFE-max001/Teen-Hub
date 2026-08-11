// Teen-Hub/lib/resend.ts
//
// Resend email service for transactional emails
// - Application confirmations
// - Trial results
// - Quest notifications
// - Payment receipts
//
// Founder Control: All email templates are founder-configurable.
// AI Automation: Email content is auto-generated based on user actions.

import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY

if (!RESEND_API_KEY) {
  console.warn('[Resend] RESEND_API_KEY not found in environment variables')
}

export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export type EmailType = 
  | 'application-confirmation'
  | 'trial-invitation'
  | 'trial-result'
  | 'quest-assigned'
  | 'quest-completed'
  | 'payment-received'
  | 'rank-updated'
  | 'achievement-unlocked'
  | 'trust-alert'

export interface EmailContext {
  to: string
  subject: string
  data: Record<string, any>
}

/**
 * Send transactional email via Resend
 * Uses AI-generated content where applicable
 */
export async function sendEmail(type: EmailType, context: EmailContext) {
  if (!resend) {
    console.error('[Resend] Service not initialized - skipping email send')
    return { error: 'Resend not configured' }
  }

  try {
    const template = await getEmailTemplate(type, context.data)
    
    const { data, error } = await resend.emails.send({
      from: context.data.from || 'QuestHub Guild <noreply@queithub.gg>',
      to: [context.to],
      subject: context.subject,
      html: template.html,
      text: template.text,
    })

    if (error) {
      console.error('[Resend] Send failed:', error)
      return { error }
    }

    console.log('[Resend] Email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Resend] Unexpected error:', err)
    return { error: err }
  }
}

/**
 * Get email template with AI-personalized content
 * Templates can be customized by founder in admin panel
 */
async function getEmailTemplate(type: EmailType, data: Record<string, any>) {
  switch (type) {
    case 'application-confirmation':
      return {
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: 'Cormorant Garamond', serif; background: #040A08; color: #D9EDE6; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .badge { display: inline-block; padding: 8px 16px; background: rgba(0, 255, 163, 0.1); border: 1px solid rgba(0, 255, 163, 0.3); border-radius: 20px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #00FFA3; }
                h1 { font-family: 'Cinzel', serif; font-size: 28px; color: #D9EDE6; margin: 20px 0; }
                .content { line-height: 1.8; color: #94A3B8; }
                .cta { display: inline-block; margin-top: 30px; padding: 14px 32px; background: linear-gradient(135deg, #00FFA3 0%, #00E5FF 100%); color: #040A08; text-decoration: none; border-radius: 4px; font-weight: bold; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(0, 255, 163, 0.1); font-size: 12px; color: #64748B; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <span class="badge">Guild Network</span>
                  <h1>Application Received</h1>
                </div>
                <div class="content">
                  <p>Greetings ${data.userName || 'Operative'},</p>
                  <p>Your application to join QuestHub Guild has been received and logged in the Sentinel system.</p>
                  <p>The Council will review your submission within <strong>${data.reviewTimeframe || '48-72 hours'}</strong>. You will be notified once SENTINEL AI completes its initial evaluation.</p>
                  <p><strong>Application ID:</strong> ${data.applicationId || 'N/A'}</p>
                  <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="footer">
                  <p>This is an automated message from QuestHub Guild.</p>
                  <p>© ${new Date().getFullYear()} QuestHub. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
          QuestHub Guild - Application Received
          
          Greetings ${data.userName || 'Operative'},
          
          Your application to join QuestHub Guild has been received.
          The Council will review your submission within ${data.reviewTimeframe || '48-72 hours'}.
          
          Application ID: ${data.applicationId || 'N/A'}
          Submitted: ${new Date().toLocaleDateString()}
          
          This is an automated message from QuestHub Guild.
        `
      }

    case 'trial-result':
      return {
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: 'Cormorant Garamond', serif; background: #040A08; color: #D9EDE6; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .result-box { background: rgba(0, 255, 163, 0.05); border: 1px solid rgba(0, 255, 163, 0.2); padding: 20px; border-radius: 8px; margin: 20px 0; }
                .score { font-size: 48px; font-weight: bold; color: ${data.passed ? '#00FFA3' : '#EF4444'}; }
                .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Trial Evaluation Complete</h1>
                <div class="result-box">
                  <div class="score">${data.score || 'N/A'}/100</div>
                  <div style="margin-top: 15px;">
                    <div class="metric"><span>Quality</span><span>${data.qualityScore || '-'}</span></div>
                    <div class="metric"><span>Reliability</span><span>${data.reliabilityScore || '-'}</span></div>
                    <div class="metric"><span>Attitude</span><span>${data.attitudeScore || '-'}</span></div>
                  </div>
                </div>
                <p>${data.message || 'Your trial has been evaluated by SENTINEL AI and reviewed by the Council.'}</p>
                ${data.nextStep ? `<p><strong>Next Step:</strong> ${data.nextStep}</p>` : ''}
              </div>
            </body>
          </html>
        `,
        text: `
          Trial Evaluation Complete
          
          Score: ${data.score || 'N/A'}/100
          Quality: ${data.qualityScore || '-'}
          Reliability: ${data.reliabilityScore || '-'}
          Attitude: ${data.attitudeScore || '-'}
          
          ${data.message || 'Your trial has been evaluated.'}
          ${data.nextStep ? `Next Step: ${data.nextStep}` : ''}
        `
      }

    case 'payment-received':
      return {
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: 'Cormorant Garamond', serif; background: #040A08; color: #D9EDE6; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .amount { font-size: 36px; font-weight: bold; color: #00FFA3; margin: 20px 0; }
                .details { background: rgba(255,255,255,0.03); padding: 15px; border-radius: 6px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Payment Processed Successfully</h1>
                <div class="amount">${data.currency || '$'}${data.amount || '0.00'}</div>
                <div class="details">
                  <p><strong>Quest:</strong> ${data.questTitle || 'N/A'}</p>
                  <p><strong>Transaction ID:</strong> ${data.transactionId || 'N/A'}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                  <p><strong>Platform Fee:</strong> ${data.fee || '0%'}</p>
                </div>
                <p>Your payment has been processed via Paystack. Funds will be available in your guild account shortly.</p>
                <p>XP Awarded: <strong>+${data.xpAwarded || '0'} XP</strong></p>
              </div>
            </body>
          </html>
        `,
        text: `
          Payment Processed Successfully
          
          Amount: ${data.currency || '$'}${data.amount || '0.00'}
          Quest: ${data.questTitle || 'N/A'}
          Transaction ID: ${data.transactionId || 'N/A'}
          Platform Fee: ${data.fee || '0%'}
          XP Awarded: +${data.xpAwarded || '0'} XP
          
          Your payment has been processed via Paystack.
        `
      }

    default:
      return {
        html: `<div><p>${data.message || 'Notification from QuestHub Guild'}</p></div>`,
        text: data.message || 'Notification from QuestHub Guild'
      }
  }
}

/**
 * AI-powered email personalization
 * Analyzes user behavior and generates contextual messaging
 */
export function personalizeEmailContent(userProfile: any, eventType: string): Record<string, string> {
  // This would integrate with your AI services (Mistral, Gemini, etc.)
  // For now, returns basic personalization tokens
  return {
    greeting: userProfile.rank ? `Rank ${userProfile.rank} Operative` : 'Operative',
    tone: userProfile.trustScore > 75 ? 'trusted' : 'standard',
    urgency: eventType === 'trial-result' ? 'high' : 'normal',
  }
}
