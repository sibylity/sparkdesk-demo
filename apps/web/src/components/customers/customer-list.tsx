'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import type { Customer } from '@sparkdesk/shared'

interface CustomerListProps {
  customers: Customer[]
}

export function CustomerList({ customers }: CustomerListProps) {
  const [query, setQuery] = useState('')

  const filtered = query
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase()) ||
          (c.company ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : customers

  return (
    <div>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex h-9 items-center gap-2 rounded-lg border px-3" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          <Search className="size-4" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search customers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-6 px-4 text-center" style={{ color: 'var(--text-muted)' }}>
                No customers found
              </td>
            </tr>
          ) : (
            filtered.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                <td style={{ color: 'var(--text-muted)' }}>{c.company ?? '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
