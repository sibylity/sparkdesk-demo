'use client'
import { useState, useTransition } from 'react'
import { MessageSquare, Send, StickyNote, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { trackReplySubmitted } from '@/analytics/events'

interface ReplyBoxProps {
  ticketId: string
  onReply: (body: string) => Promise<void>
  onNote: (body: string) => Promise<void>
}

export function ReplyBox({ ticketId, onReply, onNote }: ReplyBoxProps) {
  const [tab, setTab] = useState<'reply' | 'note'>('reply')
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!body.trim()) return
    startTransition(async () => {
      if (tab === 'reply') await onReply(body)
      else await onNote(body)
      trackReplySubmitted({ ticketId, replyType: tab, bodyLength: body.length })
      setBody('')
    })
  }

  return (
    <div
      className="px-8 py-4"
      style={{
        borderTop: '1px solid var(--border)',
        background: 'color-mix(in srgb, var(--bg-panel) 74%, transparent)',
      }}
    >
      <div className="mb-3 flex gap-1 rounded-lg p-1" style={{ background: 'var(--bg-raised)' }}>
        {(['reply', 'note'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold capitalize transition-colors"
            style={{
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              background: tab === t ? 'var(--bg-raised)' : 'transparent',
            }}
          >
            {t === 'reply' ? <MessageSquare className="size-3.5" aria-hidden="true" /> : <StickyNote className="size-3.5" aria-hidden="true" />}
            {t === 'reply' ? 'Reply' : 'Internal note'}
          </button>
        ))}
      </div>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.metaKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        placeholder={tab === 'reply' ? 'Reply to customer…' : 'Add an internal note…'}
        rows={3}
        className="resize-none text-[13px] leading-relaxed"
      />

      <div className="flex justify-end gap-2 mt-2.5">
        <Button variant="outline" size="sm" onClick={() => setBody('')}>
          <Trash2 aria-hidden="true" />
          Discard
        </Button>
        <Button size="sm" disabled={!body.trim() || isPending} onClick={handleSubmit}>
          <Send aria-hidden="true" />
          {tab === 'reply' ? 'Send reply' : 'Add note'}
        </Button>
      </div>
    </div>
  )
}
