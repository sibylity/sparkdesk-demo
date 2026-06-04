import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface SlaBreachWarningEmailProps {
  agentName: string
  ticketSubject: string
  ticketId: string
  customerName: string
  /** ISO 8601 deadline string, e.g. "2026-06-04T14:00:00Z" */
  slaDeadline: string
  /** How many minutes remain before the SLA is breached */
  minutesRemaining: number
  dashboardUrl: string
}

/**
 * Sent to the assigned agent when a ticket is approaching its SLA deadline.
 * Fired when minutesRemaining drops below a configured threshold (e.g. 30 minutes).
 * Trigger logic lives in the SLA enforcement worker — this template is the payload.
 */
export function SlaBreachWarningEmail({
  agentName, ticketSubject, ticketId, customerName, slaDeadline, minutesRemaining, dashboardUrl,
}: SlaBreachWarningEmailProps) {
  const urgencyText = minutesRemaining <= 15 ? 'Respond immediately' : `${minutesRemaining} minutes remaining`
  const deadline = new Date(slaDeadline).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  return (
    <Html>
      <Head />
      <Preview>SLA breach warning: {ticketSubject} — {urgencyText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={warningHeader}>
            <Text style={logo}>SparkDesk</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>SLA breach warning</Heading>
            <Text style={text}>Hi {agentName},</Text>
            <Text style={text}>
              A ticket assigned to you is approaching its SLA deadline and requires your immediate attention.
            </Text>
            <Section style={warningBox}>
              <Text style={warningLabel}>SLA BREACH IN</Text>
              <Text style={urgencyDisplay}>{urgencyText}</Text>
              <Text style={deadlineText}>Deadline: {deadline}</Text>
            </Section>
            <Section style={ticketBox}>
              <Text style={ticketLabel}>TICKET</Text>
              <Text style={ticketSubjectStyle}>{ticketSubject}</Text>
              <Text style={ticketIdStyle}>#{ticketId.slice(-8).toUpperCase()} · {customerName}</Text>
            </Section>
            <Button style={button} href={dashboardUrl}>Respond now</Button>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>You&apos;re receiving this because SLA enforcement is enabled for your SparkDesk workspace.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = { backgroundColor: '#f6f6f6', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }
const container: React.CSSProperties = { backgroundColor: '#ffffff', margin: '0 auto', padding: '0', maxWidth: '600px' }
const warningHeader: React.CSSProperties = { backgroundColor: '#7f1d1d', padding: '20px 32px' }
const logo: React.CSSProperties = { color: '#fca5a5', fontSize: '18px', fontWeight: '700', margin: '0' }
const content: React.CSSProperties = { padding: '32px' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: '700', color: '#09090B', margin: '0 0 16px' }
const text: React.CSSProperties = { fontSize: '15px', color: '#3f3f46', lineHeight: '24px', margin: '0 0 12px' }
const warningBox: React.CSSProperties = { backgroundColor: '#fef2f2', borderRadius: '8px', padding: '16px 20px', margin: '24px 0', border: '1px solid #fecaca' }
const warningLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#dc2626', letterSpacing: '0.08em', margin: '0 0 4px', textTransform: 'uppercase' }
const urgencyDisplay: React.CSSProperties = { fontSize: '20px', fontWeight: '700', color: '#dc2626', margin: '0 0 4px' }
const deadlineText: React.CSSProperties = { fontSize: '13px', color: '#71717a', margin: '0' }
const ticketBox: React.CSSProperties = { backgroundColor: '#f4f4f5', borderRadius: '8px', padding: '16px 20px', margin: '0 0 24px' }
const ticketLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#71717a', letterSpacing: '0.08em', margin: '0 0 4px', textTransform: 'uppercase' }
const ticketSubjectStyle: React.CSSProperties = { fontSize: '15px', fontWeight: '600', color: '#09090B', margin: '0 0 4px' }
const ticketIdStyle: React.CSSProperties = { fontSize: '12px', color: '#71717a', margin: '0' }
const button: React.CSSProperties = { backgroundColor: '#dc2626', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', display: 'inline-block' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0' }
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0' }
