import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface TicketResolvedEmailProps {
  customerName: string
  ticketSubject: string
  ticketId: string
  agentName: string
  supportUrl: string
}

/**
 * Sent to the customer when their ticket is marked resolved.
 * Includes a link to reopen if the issue persists.
 */
export function TicketResolvedEmail({
  customerName, ticketSubject, ticketId, agentName, supportUrl,
}: TicketResolvedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your ticket has been resolved — {ticketSubject}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SparkDesk</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>Your ticket has been resolved</Heading>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>
              {agentName} has marked your support ticket as resolved. We hope we were able to help!
            </Text>
            <Section style={ticketBox}>
              <Text style={ticketLabel}>RESOLVED</Text>
              <Text style={ticketSubjectStyle}>{ticketSubject}</Text>
              <Text style={ticketIdStyle}>#{ticketId.slice(-8).toUpperCase()}</Text>
            </Section>
            <Text style={text}>If your issue isn&apos;t fully resolved, you can reopen the ticket at any time.</Text>
            <Button style={button} href={supportUrl}>View ticket</Button>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>You&apos;re receiving this because you submitted a support request to SparkDesk.</Text>
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
const ticketBox: React.CSSProperties = { backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '16px 20px', margin: '24px 0', border: '1px solid #bbf7d0' }
const ticketLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#16a34a', letterSpacing: '0.08em', margin: '0 0 4px', textTransform: 'uppercase' }
const ticketSubjectStyle: React.CSSProperties = { fontSize: '15px', fontWeight: '600', color: '#09090B', margin: '0 0 4px' }
const ticketIdStyle: React.CSSProperties = { fontSize: '12px', color: '#71717a', margin: '0' }
const button: React.CSSProperties = { backgroundColor: '#818CF8', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', display: 'inline-block', marginTop: '8px' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0' }
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0' }
