import { apiClient } from '@/lib/api-client'
import { CustomerList } from '@/components/customers/customer-list'
import type { Customer } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

export default async function CustomersPage() {
  const customers = await apiClient.customers.list(DEMO_ORG_ID) as Customer[]

  return (
    <div className="app-page">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="page-kicker">Directory</div>
          <h1 className="page-title mt-1">Customers</h1>
          <p className="page-copy mt-1">
            {customers.length} customer{customers.length !== 1 ? 's' : ''} across active support conversations
          </p>
        </div>
      </div>
      <div className="surface overflow-hidden">
        <CustomerList customers={customers} />
      </div>
    </div>
  )
}
