'use client'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

interface ResolveButtonProps {
  onResolve: () => Promise<void>
  isResolved: boolean
}

export function ResolveButton({ onResolve, isResolved }: ResolveButtonProps) {
  const [isPending, startTransition] = useTransition()

  if (isResolved) {
    return (
      <span className="text-[12px] font-medium px-2.5" style={{ color: 'var(--resolved)' }}>
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
      {isPending ? 'Resolving…' : 'Resolve'}
    </Button>
  )
}
