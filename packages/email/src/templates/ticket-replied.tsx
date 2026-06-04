import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface TicketRepliedEmailProps {
  customerName: string
  ticketSubject: string
  ticketId: string
  /** Name of the agent who sent the reply */
  agentName: string
  /** The reply body text to show in the email */
  replyBody: string
  supportUrl: string
}

/**
 * Sent to the customer when an agent replies to their ticket.
 * Shows the reply inline so the customer can respond without opening the portal.
 */
export function TicketRepliedEmail({
  customerName, ticketSubject, ticketId, agentName, replyBody, supportUrl,
}: TicketRepliedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{agentName} replied to your ticket: {ticketSubject}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SparkDesk</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>New reply on your ticket</Heading>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>{agentName} from our team has replied to your ticket.</Text>
            <Section style={replyBox}>
              <Text style={replyAgentName}>{agentName}</Text>
              <Text style={replyBodyStyle}>{replyBody}</Text>
            </Section>
            <Button style={button} href={supportUrl}>View full conversation</Button>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Ticket #{ticketId.slice(-8).toUpperCase()} · {ticketSubject}
            </Text>
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
const replyBox: React.CSSProperties = { borderLeft: '3px solid #818CF8', paddingLeft: '16px', margin: '24px 0' }
const replyAgentName: React.CSSProperties = { fontSize: '13px', fontWeight: '600', color: '#818CF8', margin: '0 0 8px' }
const replyBodyStyle: React.CSSProperties = { fontSize: '15px', color: '#3f3f46', lineHeight: '24px', margin: '0' }
const button: React.CSSProperties = { backgroundColor: '#818CF8', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', display: 'inline-block', marginTop: '24px' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0' }
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0' }
