'use client'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ReplyBoxProps {
  onReply: (body: string) => Promise<void>
  onNote: (body: string) => Promise<void>
}

export function ReplyBox({ onReply, onNote }: ReplyBoxProps) {
  const [tab, setTab] = useState<'reply' | 'note'>('reply')
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!body.trim()) return
    startTransition(async () => {
      if (tab === 'reply') await onReply(body)
      else await onNote(body)
      setBody('')
    })
  }

  return (
    <div className="px-6 py-3.5" style={{ borderTop: '1px solid var(--border)' }}>
      {/* Tabs */}
      <div className="flex gap-0 mb-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        {(['reply', 'note'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-[5px] text-[12px] font-medium capitalize bg-transparent border-none cursor-pointer"
            style={{
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: `2px solid ${tab === t ? 'var(--accent-color)' : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            {t === 'reply' ? 'Reply' : 'Internal note'}
          </button>
        ))}
      </div>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={tab === 'reply' ? 'Reply to customer…' : 'Add an internal note…'}
        rows={3}
        className="resize-none text-[13px] leading-relaxed"
      />

      <div className="flex justify-end gap-2 mt-2.5">
        <Button variant="outline" size="sm" onClick={() => setBody('')}>
          Discard
        </Button>
        <Button size="sm" disabled={!body.trim() || isPending} onClick={handleSubmit}>
          {tab === 'reply' ? 'Send reply' : 'Add note'}
        </Button>
      </div>
    </div>
  )
}
