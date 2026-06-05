'use client'
import { useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResolveButtonProps {
  onResolve: () => Promise<void>
  isResolved: boolean
}

export function ResolveButton({ onResolve, isResolved }: ResolveButtonProps) {
  const [isPending, startTransition] = useTransition()

  if (isResolved) {
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
      onClick={() => startTransition(() => onResolve())}
    >
      <CheckCircle2 aria-hidden="true" />
      {isPending ? 'Resolving…' : 'Resolve'}
    </Button>
  )
}
