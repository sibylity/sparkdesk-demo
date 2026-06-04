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
    startTransition(() => onToggle(toggle.key, next))
  }

  return (
    <div className="flex items-start justify-between gap-4 py-4 px-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {toggle.name}
          </span>
          {toggle.requiredPlan && (
            <span
              className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
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
        className="relative flex-shrink-0 w-9 h-5 rounded-full transition-colors cursor-pointer border-none mt-0.5"
        style={{
          background: enabled ? 'var(--accent-color)' : 'var(--bg-hover)',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            background: 'white',
            left: '2px',
            transform: enabled ? 'translateX(16px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  )
}
