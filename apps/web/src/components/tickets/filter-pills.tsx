'use client'
import { useRef, useState, useLayoutEffect } from 'react'
import type { TicketStatus } from '@sparkdesk/shared'
import { trackInboxFilterApplied } from '@/analytics/events'

interface Filter { label: string; value: TicketStatus | 'all' }

interface FilterPillsProps {
  filters: Filter[]
  activeFilter: TicketStatus | 'all'
  onFilterChange: (value: TicketStatus | 'all') => void
  counts?: Partial<Record<TicketStatus | 'all', number>>
}

const statusColor: Record<string, string> = {
  open:                'var(--accent-color)',
  in_progress:         'var(--violet)',
  waiting_on_customer: 'var(--waiting)',
  resolved:            'var(--resolved)',
  all:                 'var(--text-secondary)',
}

function pillStyle(active: boolean, value: string): React.CSSProperties {
  const color = statusColor[value] ?? 'var(--text-secondary)'
  return active
    ? {
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }
    : {
        background: 'transparent',
        color: 'var(--text-muted)',
        border: '1px solid var(--border-panel)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }
}

function PillContent({ label, count, active, value }: { label: string; count?: number; active: boolean; value: string }) {
  const color = statusColor[value] ?? 'var(--text-secondary)'
  return (
    <span className="flex items-center gap-1.5">
      {label}
      {count !== undefined && (
        <span
          className="text-[11px] font-normal"
          style={{ color: active ? `color-mix(in srgb, ${color} 70%, transparent)` : 'var(--text-muted)' }}
        >
          {count}
        </span>
      )}
    </span>
  )
}

export function FilterPills({ filters, activeFilter, onFilterChange, counts }: FilterPillsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(filters.length)
  const [overflowOpen, setOverflowOpen] = useState(false)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const containerWidth = container.offsetWidth
      const pills = Array.from(container.querySelectorAll<HTMLElement>('[data-pill]'))
      const overflowWidth = 36
      const gap = 4

      let used = 0
      let count = 0
      for (let i = 0; i < pills.length; i++) {
        const pillWidth = pills[i]!.offsetWidth + gap
        const budget = containerWidth - (count < filters.length - 1 ? overflowWidth + gap : 0)
        if (used + pillWidth <= budget) {
          used += pillWidth
          count++
        } else {
          break
        }
      }
      setVisibleCount(Math.max(1, count))
    }

    const ro = new ResizeObserver(measure)
    ro.observe(container)
    measure()
    return () => ro.disconnect()
  }, [filters.length])

  // If the active filter is in overflow, swap it into the last visible slot
  const activeIdx = filters.findIndex((f) => f.value === activeFilter)
  const activeIsOverflow = activeIdx >= visibleCount

  const displayOrder = activeIsOverflow
    ? [
        ...filters.slice(0, visibleCount - 1),
        filters[activeIdx]!,
        ...filters.slice(visibleCount - 1, activeIdx),
        ...filters.slice(activeIdx + 1),
      ]
    : filters

  const visible  = displayOrder.slice(0, visibleCount)
  const overflow = displayOrder.slice(visibleCount)
  const overflowActive = overflow.some((f) => f.value === activeFilter)

  const handleChange = (value: TicketStatus | 'all') => {
    onFilterChange(value)
    trackInboxFilterApplied({ filterType: 'status', filterValue: value })
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      {/* All pills rendered invisibly for measurement, then display order used for visible */}
      {filters.map((f) => (
        <button
          key={f.value}
          data-pill
          className="h-7 flex-shrink-0 rounded-full px-3 text-[12px] font-semibold"
          style={{
            ...pillStyle(false, f.value),
            visibility: 'hidden',
            pointerEvents: 'none',
            position: 'absolute',
          }}
          aria-hidden
        >
          <PillContent label={f.label} count={counts?.[f.value]} active={false} value={f.value} />
        </button>
      ))}

      {visible.map((f) => {
        const active = activeFilter === f.value
        return (
          <button
            key={f.value}
            onClick={() => handleChange(f.value)}
            className="h-7 flex-shrink-0 rounded-full px-3 text-[12px] font-semibold transition-colors"
            style={pillStyle(active, f.value)}
          >
            <PillContent label={f.label} count={counts?.[f.value]} active={active} value={f.value} />
          </button>
        )
      })}

      {overflow.length > 0 && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setOverflowOpen((o) => !o)}
            className="h-7 rounded-full px-2.5 text-[12px] font-semibold transition-colors"
            style={pillStyle(overflowActive, overflowActive ? (overflow.find((f) => f.value === activeFilter)?.value ?? 'all') : 'all')}
          >
            +{overflow.length}
          </button>

          {overflowOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOverflowOpen(false)} />
              <div
                className="absolute left-0 top-9 z-20 min-w-[120px] rounded-lg p-1"
                style={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-soft)',
                }}
              >
                {overflow.map((f) => {
                  const active = activeFilter === f.value
                  const color = statusColor[f.value] ?? 'var(--text-secondary)'
                  return (
                    <button
                      key={f.value}
                      onClick={() => { handleChange(f.value); setOverflowOpen(false) }}
                      className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors"
                      style={{
                        color: active ? color : 'var(--text-secondary)',
                        background: active ? `color-mix(in srgb, ${color} 12%, transparent)` : 'transparent',
                      }}
                    >
                      <span>{f.label}</span>
                      {counts?.[f.value] !== undefined && (
                        <span className="text-[11px] font-normal" style={{ color: active ? color : 'var(--text-muted)' }}>
                          {counts[f.value]}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
