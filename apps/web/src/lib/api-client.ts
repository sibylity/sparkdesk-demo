const API_URL = process.env.INTERNAL_API_URL ?? 'http://localhost:3001'
const API_SECRET = process.env.INTERNAL_API_SECRET ?? ''

interface RequestOptions {
  organizationId: string
  agentId?: string
  method?: string
  body?: unknown
}

interface ToggleDefinition {
  key: string
  name: string
  description: string
  defaultEnabled: boolean
  requiredPlan: string | null
  enabled: boolean
}

async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_SECRET}`,
      'X-Organization-Id': options.organizationId,
      ...(options.agentId && { 'X-Agent-Id': options.agentId }),
    },
    ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error((error as { error?: string }).error ?? `API error ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const apiClient = {
  tickets: {
    list: (orgId: string, params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiRequest<unknown[]>(`/internal/tickets${qs}`, { organizationId: orgId })
    },
    get: (orgId: string, id: string) =>
      apiRequest<unknown>(`/internal/tickets/${id}`, { organizationId: orgId }),
    create: (orgId: string, body: unknown) =>
      apiRequest<unknown>('/internal/tickets', { organizationId: orgId, method: 'POST', body }),
    update: (orgId: string, id: string, body: unknown) =>
      apiRequest<unknown>(`/internal/tickets/${id}`, { organizationId: orgId, method: 'PATCH', body }),
    reply: (orgId: string, agentId: string, id: string, body: unknown) =>
      apiRequest<unknown>(`/internal/tickets/${id}/reply`, { organizationId: orgId, agentId, method: 'POST', body }),
    addNote: (orgId: string, agentId: string, id: string, body: unknown) =>
      apiRequest<unknown>(`/internal/tickets/${id}/notes`, { organizationId: orgId, agentId, method: 'POST', body }),
  },
  customers: {
    list: (orgId: string, q?: string) =>
      apiRequest<unknown[]>(`/internal/customers${q ? `?q=${q}` : ''}`, { organizationId: orgId }),
    timeline: (orgId: string, id: string) =>
      apiRequest<unknown[]>(`/internal/customers/${id}/timeline`, { organizationId: orgId }),
  },
  agents: {
    list: (orgId: string) =>
      apiRequest<unknown[]>('/internal/agents', { organizationId: orgId }),
    update: (orgId: string, id: string, body: { role: 'admin' | 'agent' }) =>
      apiRequest<{ ok: boolean }>(`/internal/agents/${id}`, {
        organizationId: orgId,
        method: 'PATCH',
        body,
      }),
    dismissTip: (orgId: string, agentId: string, tipId: string) =>
      apiRequest<{ ok: boolean }>(`/internal/agents/${agentId}/dismiss-tip`, {
        organizationId: orgId,
        agentId,
        method: 'POST',
        body: { tipId },
      }),
  },
  settings: {
    getToggles: (orgId: string) =>
      apiRequest<{ toggles: ToggleDefinition[] }>(
        '/internal/settings/toggles',
        { organizationId: orgId }
      ),
    patchToggles: (orgId: string, updates: Record<string, boolean>) =>
      apiRequest<{ ok: boolean; updated: string[] }>('/internal/settings/toggles', {
        organizationId: orgId,
        method: 'PATCH',
        body: updates,
      }),
  },
}
