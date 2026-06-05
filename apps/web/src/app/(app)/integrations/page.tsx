import { Mail, MessageSquare, Plug } from 'lucide-react'

const integrations = [
  { name: 'Slack', description: 'Route support updates into team channels.', icon: MessageSquare, status: 'Connected' },
  { name: 'Email', description: 'Sync replies and ticket notifications.', icon: Mail, status: 'Ready' },
  { name: 'Webhooks', description: 'Send ticket events to external systems.', icon: Plug, status: 'Soon' },
]

export default function IntegrationsPage() {
  return (
    <div className="app-page">
      <div className="mb-6">
        <div className="page-kicker">Automation</div>
        <h1 className="page-title mt-1">Integrations</h1>
        <p className="page-copy mt-1">Connect the channels and systems that keep support moving.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div key={integration.name} className="surface p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              >
                <integration.icon className="size-5" style={{ color: 'var(--accent-color)' }} aria-hidden="true" />
              </div>
              <span
                className="rounded-full px-2 py-1 text-[10px] font-bold uppercase"
                style={{
                  color: integration.status === 'Connected' ? 'var(--resolved)' : 'var(--text-muted)',
                  background: integration.status === 'Connected' ? 'color-mix(in srgb, var(--resolved) 12%, transparent)' : 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                }}
              >
                {integration.status}
              </span>
            </div>
            <h2 className="text-[15px] font-[720]" style={{ color: 'var(--text-primary)' }}>
              {integration.name}
            </h2>
            <p className="mt-2 text-[12.5px] leading-5" style={{ color: 'var(--text-muted)' }}>
              {integration.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
