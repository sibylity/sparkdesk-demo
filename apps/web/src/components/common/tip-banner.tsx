'use client'
import { useState } from 'react'

interface TipBannerProps {
  tipId: string
  title: string
  body: string
  onDismiss: () => Promise<void>
}

/**
 * Dismissable in-app tip banner. Renders in accent-tinted styling.
 * Calls the onDismiss server action to persist the dismissed state per-user.
 */
export function TipBanner({ tipId: _tipId, title, body, onDismiss }: TipBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 text-sm flex-shrink-0"
      style={{
        background: 'var(--accent-dim)',
        borderBottom: '1px solid var(--accent-border)',
      }}
    >
      <div className="flex-1 min-w-0">
        <span className="font-semibold" style={{ color: 'var(--accent-color)' }}>
          {title}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}> — {body}</span>
      </div>
      <button
        onClick={async () => {
          setDismissed(true)
          try {
            await onDismiss()
          } catch {
            // Dismissal failed — banner stays gone this session but will reappear next load
          }
        }}
        className="flex-shrink-0 text-xs px-2 py-0.5 rounded"
        style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
        aria-label="Dismiss tip"
      >
        Dismiss
      </button>
    </div>
  )
}
