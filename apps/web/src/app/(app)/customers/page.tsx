import { withAuth } from '@workos-inc/authkit-nextjs'
import { apiClient } from '@/lib/api-client'
import { CustomerList } from '@/components/customers/customer-list'
import type { Customer } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

export default async function CustomersPage() {
  await withAuth({ ensureSignedIn: true })
  const customers = await apiClient.customers.list(DEMO_ORG_ID) as Customer[]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[16px] font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          Customers
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <CustomerList customers={customers} />
      </div>
    </div>
  )
}
