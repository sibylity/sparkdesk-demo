import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('SparkDeskClient', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('upsertCustomer throws when API returns an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Bad request' }),
    }))

    const { SparkDeskClient } = await import('./client')
    const client = new SparkDeskClient({
      apiUrl: 'http://localhost:3001',
      apiSecret: 'test-secret',
      orgId: 'org-1',
    })

    await expect(client.upsertCustomer({
      externalId: 'slack-U123',
      name: 'Test User',
      email: 'test@example.com',
    })).rejects.toThrow('Bad request')
  })

  it('createTicket sends correct headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'ticket-1', subject: 'Test' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { SparkDeskClient } = await import('./client')
    const client = new SparkDeskClient({
      apiUrl: 'http://localhost:3001',
      apiSecret: 'my-secret',
      orgId: 'org-123',
    })

    await client.createTicket({
      subject: 'Help needed',
      body: 'My Slack message',
      customerId: 'customer-1',
      priority: 'normal',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/internal/tickets',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer my-secret',
          'X-Organization-Id': 'org-123',
        }),
      }),
    )
  })
})
