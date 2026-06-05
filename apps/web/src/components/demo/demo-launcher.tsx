'use client'
import { useState, useTransition } from 'react'
import { Zap, CheckCircle } from 'lucide-react'
import type { Customer } from '@sparkdesk/shared'

interface Scenario {
  id: string
  label: string
  tag: string
  subject: string
  body: string
}

interface DemoLauncherProps {
  customers: Customer[]
  onInject: (scenarioId: string, customerId: string) => Promise<void>
}

export function DemoLauncher({ customers, onInject }: DemoLauncherProps) {
  const [injected, setInjected] = useState<Record<string, boolean>>({})
  const [pending, startTransition] = useTransition()
  const [activePending, setActivePending] = useState<string | null>(null)

  const handleInject = (scenarioId: string) => {
    if (customers.length === 0) return
    const customer = customers[Math.floor(Math.random() * customers.length)]!
    setActivePending(scenarioId)
    startTransition(async () => {
      await onInject(scenarioId, customer.id)
      setInjected((prev) => ({ ...prev, [scenarioId]: true }))
      setActivePending(null)
      setTimeout(() => setInjected((prev) => ({ ...prev, [scenarioId]: false })), 3000)
    })
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="page-kicker mb-1">Demo Tools</div>
          <h1 className="text-[28px] font-[760] leading-none" style={{ color: 'var(--text-primary)' }}>
            Inject a ticket
          </h1>
          <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Simulates a real inbound ticket from a customer in your database. The ticket appears live in the inbox.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SCENARIO_META.map((s) => {
            const isLoading = activePending === s.id && pending
            const isDone = injected[s.id]
            return (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-xl p-4"
                style={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {s.label}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        background: 'var(--bg-surface)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {s.tag}
                    </span>
                  </div>
                  <p className="text-[12px] leading-5" style={{ color: 'var(--text-muted)' }}>
                    {s.subject}
                  </p>
                </div>

                <button
                  disabled={isLoading || pending}
                  onClick={() => handleInject(s.id)}
                  className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={{
                    background: isDone
                      ? 'color-mix(in srgb, var(--resolved) 12%, transparent)'
                      : 'var(--accent-dim)',
                    color: isDone ? 'var(--resolved)' : 'var(--accent-strong)',
                    border: `1px solid ${isDone ? 'color-mix(in srgb, var(--resolved) 28%, transparent)' : 'var(--accent-border)'}`,
                    opacity: isLoading || (pending && !isDone) ? 0.5 : 1,
                    cursor: isLoading || pending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isDone ? (
                    <>
                      <CheckCircle className="size-3.5" aria-hidden />
                      Injected
                    </>
                  ) : isLoading ? (
                    'Injecting…'
                  ) : (
                    <>
                      <Zap className="size-3.5" aria-hidden />
                      Inject ticket
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <p className="mt-6 text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
          This page is not linked in the nav — access via <code className="rounded px-1 py-0.5 text-[11px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>/demo</code>
        </p>
      </div>
    </div>
  )
}

const SCENARIO_META = [
  { id: 'billing-dispute',    label: 'Billing dispute',         tag: 'Urgent · Email', subject: 'I was charged twice for my subscription this month' },
  { id: 'integration-broken', label: 'Slack integration down',  tag: 'High · Web',     subject: 'Slack notifications stopped working after your update' },
  { id: 'export-bug',         label: 'CSV export broken',       tag: 'High · Web',     subject: 'CSV export is downloading an empty file' },
  { id: 'admin-access',       label: 'Admin access question',   tag: 'Normal · Email', subject: 'How do I give my colleague admin access?' },
  { id: 'feature-request',    label: 'Business hours routing',  tag: 'Normal · Web',   subject: 'Can you add business hours for auto-routing?' },
  { id: 'security-alert',     label: 'Suspicious login',        tag: 'Urgent · Email', subject: 'Someone may have accessed my account without permission' },
]
