/**
 * Shared property schemas for all SparkDesk analytics events.
 * Every event across apps/api and apps/web extends BaseEventProperties
 * so Voltage can correlate them into a unified taxonomy.
 */

export interface UserProperties {
  /** WorkOS user ID or agent ID */
  userId: string
  /** Agent's display email */
  userEmail?: string
  /** WorkOS Organization ID */
  orgId: string
  /** Organization display name */
  orgName?: string
  /** Agent role within the organization */
  agentRole?: 'admin' | 'agent'
}

export interface OrgProperties {
  orgId: string
  orgName?: string
  /** Billing plan for the organization */
  orgPlan?: 'free' | 'pro' | 'enterprise'
}

/**
 * Base properties carried by every server-side event.
 * Extends OrgProperties and picks the optional user fields from UserProperties
 * so downstream events get consistent naming without duplicating field definitions.
 * Client-side events (posthog-js) extend this partially —
 * posthog-js attaches user identity automatically after posthog.identify().
 */
export interface BaseEventProperties extends OrgProperties, Partial<Pick<UserProperties, 'userId' | 'userEmail'>> {
  environment?: 'development' | 'production' | 'test'
}
