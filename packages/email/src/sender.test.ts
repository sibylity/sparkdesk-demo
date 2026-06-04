import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('sendEmail', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.RESEND_API_KEY
  })

  afterEach(() => {
    delete process.env.RESEND_API_KEY
  })

  it('resolves without error when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY
    const { sendEmail } = await import('./sender')
    const el = React.createElement('div', null, 'test')
    await expect(
      sendEmail({ to: 'test@example.com', subject: 'Test', react: el })
    ).resolves.toBeUndefined()
  })

  it('calls resend.emails.send when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    const mockSend = vi.fn().mockResolvedValue({ data: { id: 'msg_123' }, error: null })
    vi.doMock('resend', () => ({
      Resend: vi.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
    }))
    const { sendEmail } = await import('./sender')
    const el = React.createElement('div', null, 'test')
    await sendEmail({ to: 'agent@sparkdesk.io', subject: 'You have been assigned', react: el })
    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'agent@sparkdesk.io', subject: 'You have been assigned' })
    )
  })
})
