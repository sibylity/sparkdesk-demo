'use client'
import { useTransition } from 'react'
import { CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TicketStatus } from '@sparkdesk/shared'

interface Props {
  onStatusChange: (status: TicketStatus) => Promise<void>
  status: TicketStatus
}

export function WaitingButton({ onStatusChange, status }: Props) {
  const [isPending, startTransition] = useTransition()

  if (status === 'waiting_on_customer') {
    return (
      <span
        className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold"
        style={{
          color: 'var(--waiting)',
          background: 'color-mix(in srgb, var(--waiting) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--waiting) 28%, transparent)',
        }}
      >
        <Clock className="size-3.5" aria-hidden="true" />
        Waiting
      </span>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => onStatusChange('waiting_on_customer'))}
    >
      <Clock aria-hidden="true" />
      {isPending ? 'Saving…' : 'Waiting'}
    </Button>
  )
}

export function ResolveButton({ onStatusChange, status }: Props) {
  const [isPending, startTransition] = useTransition()

  if (status === 'resolved') {
    return (
      <span
        className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold"
        style={{
          color: 'var(--resolved)',
          background: 'color-mix(in srgb, var(--resolved) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--resolved) 28%, transparent)',
        }}
      >
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Resolved
      </span>
    )
  }

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => onStatusChange('resolved'))}
    >
      <CheckCircle2 aria-hidden="true" />
      {isPending ? 'Resolving…' : 'Resolve'}
    </Button>
  )
}
