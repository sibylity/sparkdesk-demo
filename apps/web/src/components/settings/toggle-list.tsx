'use client'
import { useState, useTransition } from 'react'

interface Toggle {
  key: string
  name: string
  description: string
  requiredPlan: string | null
  enabled: boolean
}

interface ToggleListProps {
  toggles: Toggle[]
  onToggle: (key: string, enabled: boolean) => Promise<void>
}

export function ToggleList({ toggles, onToggle }: ToggleListProps) {
  return (
    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
      {toggles.map((toggle) => (
        <ToggleRow key={toggle.key} toggle={toggle} onToggle={onToggle} />
      ))}
    </div>
  )
}

function ToggleRow({ toggle, onToggle }: { toggle: Toggle; onToggle: (key: string, enabled: boolean) => Promise<void> }) {
  const [enabled, setEnabled] = useState(toggle.enabled)
  const [isPending, startTransition] = useTransition()

  function handleChange() {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      try {
        await onToggle(toggle.key, next)
      } catch {
        setEnabled(enabled)
      }
    })
  }

  return (
    <div className="flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-[color-mix(in_srgb,var(--bg-hover)_48%,transparent)]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {toggle.name}
          </span>
          {toggle.requiredPlan && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent-color)', border: '1px solid var(--accent-border)' }}
            >
              {toggle.requiredPlan}
            </span>
          )}
        </div>
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {toggle.description}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        disabled={isPending}
        onClick={handleChange}
        className="relative mt-0.5 h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border transition-colors"
        style={{
          background: enabled ? 'var(--accent-color)' : 'var(--bg-hover)',
          borderColor: enabled ? 'var(--accent-border)' : 'var(--border)',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full transition-transform"
          style={{
            background: enabled ? 'var(--bg)' : 'var(--text-muted)',
            left: '2px',
            transform: enabled ? 'translateX(16px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  )
}
