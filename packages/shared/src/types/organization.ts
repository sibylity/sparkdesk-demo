export interface Organization {
  id: string
  name: string
  workosOrganizationId: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: string
}
