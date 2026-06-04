import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db'
import { serviceAuthMiddleware } from '../middleware/auth'
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  ReplyTicketSchema,
  AddNoteSchema,
} from '@sparkdesk/shared'
import { capture } from '@sparkdesk/analytics'
import * as React from 'react'
import {
  sendEmail,
  TicketCreatedEmail,
  TicketRepliedEmail,
  TicketResolvedEmail,
  AgentAssignedEmail,
} from '@sparkdesk/email'

const APP_URL = process.env.WEB_APP_URL ?? 'http://localhost:3000'

export const ticketRoutes = new Hono()

ticketRoutes.use('*', serviceAuthMiddleware)

// List tickets (filterable by status, priority, assigneeId)
ticketRoutes.get('/', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const { status, priority, assigneeId } = c.req.query()

  const tickets = await db.ticket.findMany({
    where: {
      organizationId: orgId,
      ...(status && { status: status as any }),
      ...(priority && { priority: priority as any }),
      ...(assigneeId && { assigneeId }),
    },
    include: { customer: true, assignee: true },
    orderBy: { updatedAt: 'desc' },
  })

  return c.json(tickets)
})

// Get single ticket with messages and notes
ticketRoutes.get('/:id', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const ticket = await db.ticket.findFirst({
    where: { id: c.req.param('id'), organizationId: orgId },
    include: {
      customer: true,
      assignee: true,
      messages: { orderBy: { createdAt: 'asc' } },
      notes: { include: { agent: true }, orderBy: { createdAt: 'asc' } },
    },
  })

  if (!ticket) return c.json({ error: 'Not found' }, 404)
  return c.json(ticket)
})

// Create ticket
ticketRoutes.post('/', zValidator('json', CreateTicketSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const data = c.req.valid('json')

  const ticket = await db.ticket.create({
    data: {
      subject: data.subject,
      priority: data.priority,
      channel: data.channel,
      organizationId: orgId,
      customerId: data.customerId,
      assigneeId: data.assigneeId ?? null,
      messages: {
        create: {
          body: data.body,
          authorType: 'customer',
        },
      },
    },
    include: { customer: true, assignee: true },
  })

  capture('ticket_created', {
    distinctId: orgId,
    orgId,
    ticketId: ticket.id,
    priority: ticket.priority,
    channel: ticket.channel,
    customerId: ticket.customerId,
    assigneeId: ticket.assigneeId ?? undefined,
  })

  void sendEmail({
    to: ticket.customer.email,
    subject: `[SparkDesk] We've received your request: ${ticket.subject}`,
    react: React.createElement(TicketCreatedEmail, {
      customerName: ticket.customer.name,
      ticketSubject: ticket.subject,
      ticketId: ticket.id,
      supportUrl: `${APP_URL}/tickets/${ticket.id}`,
    }),
  })

  return c.json(ticket, 201)
})

// Update ticket (status, priority, assignee)
ticketRoutes.patch('/:id', zValidator('json', UpdateTicketSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const data = c.req.valid('json')

  const ticket = await db.ticket.updateMany({
    where: { id: c.req.param('id'), organizationId: orgId },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.priority && { priority: data.priority }),
      ...('assigneeId' in data && { assigneeId: data.assigneeId }),
      ...(data.snoozedUntil && { snoozedUntil: new Date(data.snoozedUntil), status: 'snoozed' }),
    },
  })

  if (ticket.count === 0) return c.json({ error: 'Not found' }, 404)

  capture('ticket_updated', {
    distinctId: orgId,
    orgId,
    ticketId: c.req.param('id'),
    ...(data.status && { status: data.status }),
    ...(data.priority && { priority: data.priority }),
    ...('assigneeId' in data && { assigneeId: data.assigneeId }),
    ...(data.snoozedUntil && { snoozedUntil: data.snoozedUntil }),
  })

  if (data.status === 'resolved') {
    const resolvedTicket = await db.ticket.findFirst({
      where: { id: c.req.param('id') },
      include: { customer: true },
    })
    if (resolvedTicket) {
      void sendEmail({
        to: resolvedTicket.customer.email,
        subject: `[SparkDesk] Your ticket has been resolved: ${resolvedTicket.subject}`,
        react: React.createElement(TicketResolvedEmail, {
          customerName: resolvedTicket.customer.name,
          ticketSubject: resolvedTicket.subject,
          ticketId: resolvedTicket.id,
          agentName: 'Support Team',
          supportUrl: `${APP_URL}/tickets/${resolvedTicket.id}`,
        }),
      })
    }
  }

  if ('assigneeId' in data && data.assigneeId) {
    const assignedTicket = await db.ticket.findFirst({
      where: { id: c.req.param('id') },
      include: { customer: true, assignee: true },
    })
    if (assignedTicket?.assignee) {
      void sendEmail({
        to: assignedTicket.assignee.email,
        subject: `[SparkDesk] Ticket assigned to you: ${assignedTicket.subject}`,
        react: React.createElement(AgentAssignedEmail, {
          agentName: assignedTicket.assignee.name,
          ticketSubject: assignedTicket.subject,
          ticketId: assignedTicket.id,
          customerName: assignedTicket.customer.name,
          priority: assignedTicket.priority as 'urgent' | 'high' | 'normal' | 'low',
          dashboardUrl: `${APP_URL}/tickets/${assignedTicket.id}`,
        }),
      })
    }
  }

  return c.json({ ok: true })
})

// Reply to customer
ticketRoutes.post('/:id/reply', zValidator('json', ReplyTicketSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  const agentId = c.req.header('X-Agent-Id')
  if (!orgId || !agentId) return c.json({ error: 'Missing headers' }, 400)

  const { body } = c.req.valid('json')

  const [message] = await db.$transaction([
    db.message.create({
      data: { ticketId: c.req.param('id'), body, authorType: 'agent', agentId },
    }),
    db.ticket.updateMany({
      where: { id: c.req.param('id'), organizationId: orgId },
      data: { status: 'in_progress', updatedAt: new Date() },
    }),
  ])

  capture('ticket_reply_sent', {
    distinctId: agentId,
    orgId,
    ticketId: c.req.param('id'),
    agentId,
  })

  const ticketForEmail = await db.ticket.findFirst({
    where: { id: c.req.param('id') },
    include: { customer: true },
  })
  if (ticketForEmail) {
    void sendEmail({
      to: ticketForEmail.customer.email,
      subject: `[SparkDesk] New reply on your ticket: ${ticketForEmail.subject}`,
      react: React.createElement(TicketRepliedEmail, {
        customerName: ticketForEmail.customer.name,
        ticketSubject: ticketForEmail.subject,
        ticketId: ticketForEmail.id,
        agentName: 'Support Team',
        replyBody: body,
        supportUrl: `${APP_URL}/tickets/${ticketForEmail.id}`,
      }),
    })
  }

  return c.json(message, 201)
})

// Add internal note
ticketRoutes.post('/:id/notes', zValidator('json', AddNoteSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  const agentId = c.req.header('X-Agent-Id')
  if (!orgId || !agentId) return c.json({ error: 'Missing headers' }, 400)

  const { body } = c.req.valid('json')

  const note = await db.note.create({
    data: { ticketId: c.req.param('id'), body, agentId },
    include: { agent: true },
  })

  capture('ticket_note_added', {
    distinctId: agentId,
    orgId,
    ticketId: c.req.param('id'),
    agentId,
  })

  return c.json(note, 201)
})
