'use client'
import { useState } from 'react'
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
      {/* Search */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <input
          type="text"
          placeholder="Search customers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full text-[13px] bg-transparent border-none outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      {/* Table */}
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="text-left py-2 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Name</th>
            <th className="text-left py-2 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Email</th>
            <th className="text-left py-2 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Company</th>
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
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-3 px-4" style={{ color: 'var(--text-primary)' }}>{c.name}</td>
                <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{c.company ?? '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
