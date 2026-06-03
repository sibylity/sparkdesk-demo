export interface Customer {
  id: string
  externalId: string | null
  name: string
  email: string
  company: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}
