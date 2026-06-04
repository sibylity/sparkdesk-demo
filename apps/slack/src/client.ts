/**
 * SparkDesk API client for apps/slack.
 *
 * All state operations in the Slack app go through this client —
 * apps/slack never connects to the database directly.
 */

interface ClientOptions {
  apiUrl: string
  apiSecret: string
  orgId: string
}

interface UpsertCustomerOptions {
  externalId: string
  name: string
  email: string
}

interface CreateTicketOptions {
  subject: string
  body: string
  customerId: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
}

interface AddReplyOptions {
  ticketId: string
  body: string
  agentId: string
}

export interface SparkDeskCustomer {
  id: string
  name: string
  email: string
  externalId: string | null
}

export interface SparkDeskTicket {
  id: string
  subject: string
  status: string
  customerId: string
}

export class SparkDeskClient {
  private readonly apiUrl: string
  private readonly headers: Record<string, string>

  constructor({ apiUrl, apiSecret, orgId }: ClientOptions) {
    this.apiUrl = apiUrl
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiSecret}`,
      'X-Organization-Id': orgId,
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: { ...this.headers, ...(options.headers as Record<string, string> ?? {}) },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string }
      throw new Error(body.error ?? `API error ${res.status}`)
    }

    return res.json() as Promise<T>
  }

  upsertCustomer(opts: UpsertCustomerOptions): Promise<SparkDeskCustomer> {
    return this.request<SparkDeskCustomer>('/internal/customers', {
      method: 'POST',
      body: JSON.stringify(opts),
    })
  }

  createTicket(opts: CreateTicketOptions): Promise<SparkDeskTicket> {
    return this.request<SparkDeskTicket>('/internal/tickets', {
      method: 'POST',
      body: JSON.stringify({ ...opts, channel: 'slack' }),
    })
  }

  addReply(opts: AddReplyOptions): Promise<void> {
    return this.request<void>(`/internal/tickets/${opts.ticketId}/reply`, {
      method: 'POST',
      headers: { 'X-Agent-Id': opts.agentId },
      body: JSON.stringify({ body: opts.body }),
    })
  }

  getOpenTicketByCustomer(customerId: string): Promise<SparkDeskTicket | null> {
    return this.request<SparkDeskTicket[]>(`/internal/tickets?customerId=${customerId}&status=open`)
      .then((tickets) => tickets[0] ?? null)
      .catch(() => null)
  }
}

/** Singleton factory — call once per process with env vars */
export function createSparkDeskClient(): SparkDeskClient {
  return new SparkDeskClient({
    apiUrl: process.env.INTERNAL_API_URL ?? 'http://localhost:3001',
    apiSecret: process.env.INTERNAL_API_SECRET ?? '',
    orgId: process.env.DEMO_ORG_ID ?? '',
  })
}
