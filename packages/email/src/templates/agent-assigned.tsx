import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface AgentAssignedEmailProps {
  /** Name of the agent being assigned */
  agentName: string
  ticketSubject: string
  ticketId: string
  customerName: string
  /** Ticket priority level */
  priority: 'urgent' | 'high' | 'normal' | 'low'
  /** Link directly to the ticket in the dashboard */
  dashboardUrl: string
}

/**
 * Sent to an agent when a ticket is assigned to them.
 * Includes ticket context so they can respond without navigating first.
 */
export function AgentAssignedEmail({
  agentName, ticketSubject, ticketId, customerName, priority, dashboardUrl,
}: AgentAssignedEmailProps) {
  const priorityColor = priority === 'urgent' ? '#ef4444' : priority === 'high' ? '#f97316' : '#71717a'

  return (
    <Html>
      <Head />
      <Preview>Ticket assigned to you: {ticketSubject}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SparkDesk</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>You&apos;ve been assigned a ticket</Heading>
            <Text style={text}>Hi {agentName},</Text>
            <Text style={text}>A support ticket has been assigned to you and is waiting for your response.</Text>
            <Section style={ticketBox}>
              <Text style={ticketLabel}>ASSIGNED TICKET</Text>
              <Text style={ticketSubjectStyle}>{ticketSubject}</Text>
              <Text style={ticketIdStyle}>
                #{ticketId.slice(-8).toUpperCase()} · {customerName} ·{' '}
                <span style={{ color: priorityColor, fontWeight: '600' }}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </span>
              </Text>
            </Section>
            <Button style={button} href={dashboardUrl}>Open ticket</Button>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>You&apos;re receiving this because a ticket was assigned to your SparkDesk account.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = { backgroundColor: '#f6f6f6', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }
const container: React.CSSProperties = { backgroundColor: '#ffffff', margin: '0 auto', padding: '0', maxWidth: '600px' }
const header: React.CSSProperties = { backgroundColor: '#09090B', padding: '20px 32px' }
const logo: React.CSSProperties = { color: '#818CF8', fontSize: '18px', fontWeight: '700', margin: '0' }
const content: React.CSSProperties = { padding: '32px' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: '700', color: '#09090B', margin: '0 0 16px' }
const text: React.CSSProperties = { fontSize: '15px', color: '#3f3f46', lineHeight: '24px', margin: '0 0 12px' }
const ticketBox: React.CSSProperties = { backgroundColor: '#f4f4f5', borderRadius: '8px', padding: '16px 20px', margin: '24px 0' }
const ticketLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#71717a', letterSpacing: '0.08em', margin: '0 0 4px', textTransform: 'uppercase' }
const ticketSubjectStyle: React.CSSProperties = { fontSize: '15px', fontWeight: '600', color: '#09090B', margin: '0 0 4px' }
const ticketIdStyle: React.CSSProperties = { fontSize: '12px', color: '#71717a', margin: '0' }
const button: React.CSSProperties = { backgroundColor: '#818CF8', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', display: 'inline-block' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0' }
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0' }
