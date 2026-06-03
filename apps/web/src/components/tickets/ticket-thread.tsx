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
    <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-[18px]">
      {items.map((item) => {
        if (item.type === 'note') {
          return (
            <div
              key={item.id}
              className="flex gap-2.5 items-start rounded-lg px-3.5 py-2.5 text-[12.5px] leading-relaxed"
              style={{
                background: '#FBBF2408',
                border: '1px solid #FBBF2420',
                color: '#FBBF24',
              }}
            >
              <span className="text-[10.5px] font-semibold uppercase tracking-wider opacity-60 mt-px flex-shrink-0">
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
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={
                isAgent
                  ? { background: 'var(--accent-dim)', color: 'var(--accent-color)' }
                  : { background: 'var(--bg-surface)', color: 'var(--text-muted)' }
              }
            >
              {initials(item.authorName)}
            </div>
            <div className={`max-w-[76%] ${isAgent ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className="px-3.5 py-2.5 rounded-lg text-[13px] leading-relaxed"
                style={
                  isAgent
                    ? {
                        background: 'var(--accent-dim)',
                        border: '1px solid var(--accent-border)',
                        color: 'var(--text-primary)',
                        borderRadius: '8px 2px 8px 8px',
                      }
                    : {
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        borderRadius: '2px 8px 8px 8px',
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
