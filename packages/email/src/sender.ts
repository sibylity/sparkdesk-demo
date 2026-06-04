import { Resend } from 'resend'
import * as React from 'react'

let _client: Resend | null = null

/**
 * Returns the Resend client.
 * Returns null (safe no-op) when RESEND_API_KEY is not set —
 * so local development works without a Resend account.
 */
function getResendClient(): Resend | null {
  if (_client) return _client
  if (!process.env.RESEND_API_KEY) return null
  _client = new Resend(process.env.RESEND_API_KEY)
  return _client
}

export interface SendEmailOptions {
  /** Recipient email address */
  to: string
  subject: string
  /** React Email template element — Resend renders it to HTML internally */
  react: React.ReactNode
}

/**
 * Send a transactional email via Resend.
 * No-ops when RESEND_API_KEY is not set.
 */
export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<void> {
  const client = getResendClient()
  if (!client) return

  try {
    await client.emails.send({
      from: process.env.EMAIL_FROM ?? 'SparkDesk <noreply@sparkdesk.io>',
      to,
      subject,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      react: react as any,
    })
  } catch (err) {
    console.error('[sendEmail] failed to send to', to, err)
  }
}
