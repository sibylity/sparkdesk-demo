export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_customer'
  | 'resolved'
  | 'closed'
  | 'snoozed'
  | 'spam'

export type TicketPriority = 'urgent' | 'high' | 'normal' | 'low'

export type TicketChannel = 'web' | 'api' | 'slack' | 'email'

export interface Ticket {
  id: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  channel: TicketChannel
  organizationId: string
  customerId: string
  assigneeId: string | null
  slaDeadline: string | null  // ISO 8601
  createdAt: string
  updatedAt: string
}

export interface TicketMessage {
  id: string
  ticketId: string
  body: string
  authorType: 'customer' | 'agent'
  authorId: string
  createdAt: string
}

export interface TicketNote {
  id: string
  ticketId: string
  body: string
  authorId: string
  createdAt: string
}
