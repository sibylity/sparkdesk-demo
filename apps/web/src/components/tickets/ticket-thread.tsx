import type { TicketMessage, TicketNote } from '@sparkdesk/shared'

interface ThreadItem {
  type: 'message' | 'note'
  id: string
  body: string
  authorType?: 'customer' | 'agent'
  authorName?: string
  createdAt: string
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function initials(name?: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function TicketThread({ items }: { items: ThreadItem[] }) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-5">
      {items.map((item) => {
        if (item.type === 'note') {
          return (
            <div
              key={item.id}
              className="mx-auto flex max-w-[760px] items-start gap-3 rounded-lg px-3.5 py-3 text-[12.5px] leading-relaxed"
              style={{
                background: 'color-mix(in srgb, var(--waiting) 9%, transparent)',
                border: '1px solid color-mix(in srgb, var(--waiting) 26%, transparent)',
                color: 'var(--waiting)',
              }}
            >
              <span className="mt-px flex-shrink-0 text-[10.5px] font-bold uppercase opacity-70">
                Note
              </span>
              <span>{item.body}</span>
            </div>
          )
        }

        const isAgent = item.authorType === 'agent'
        return (
          <div key={item.id} className={`flex gap-2.5 items-start ${isAgent ? 'flex-row-reverse' : ''}`}>
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={
                isAgent
                  ? {
                      background: 'var(--accent-dim)',
                      color: 'var(--accent-strong)',
                      border: '1px solid var(--accent-border)',
                    }
                  : {
                      background: 'var(--bg-raised)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }
              }
            >
              {initials(item.authorName)}
            </div>
            <div className={`max-w-[76%] ${isAgent ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className="rounded-lg px-4 py-3 text-[13px] leading-relaxed shadow-sm"
                style={
                  isAgent
                    ? {
                        background: 'var(--accent-dim)',
                        border: '1px solid var(--accent-border)',
                        color: 'var(--text-primary)',
                      }
                    : {
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }
                }
              >
                {item.body}
              </div>
              <span className="text-[11px] mt-1.5 px-0.5" style={{ color: 'var(--text-muted)' }}>
                {timeLabel(item.createdAt)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function buildThreadItems(
  messages: TicketMessage[],
  notes: (TicketNote & { agent?: { name: string } | null })[],
  customerName: string,
  agentNames: Record<string, string>
): ThreadItem[] {
  const items: ThreadItem[] = [
    ...messages.map((m) => ({
      type: 'message' as const,
      id: m.id,
      body: m.body,
      authorType: m.authorType,
      authorName: m.authorType === 'customer' ? customerName : (agentNames[m.authorId] ?? 'Agent'),
      createdAt: m.createdAt,
    })),
    ...notes.map((n) => ({
      type: 'note' as const,
      id: n.id,
      body: n.body,
      authorName: n.agent?.name ?? 'Agent',
      createdAt: n.createdAt,
    })),
  ]
  return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}
