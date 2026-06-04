import {
  Body, Button, Column, Container, Head, Heading, Hr, Html,
  Preview, Row, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface WeeklyDigestEmailProps {
  adminName: string
  /** Display string for week start, e.g. "Jun 2" */
  weekStart: string
  /** Display string for week end, e.g. "Jun 8" */
  weekEnd: string
  ticketsCreated: number
  ticketsResolved: number
  /** Average hours from open to resolved */
  avgResolutionHours: number
  openTickets: number
  dashboardUrl: string
}

/**
 * Weekly summary email sent to workspace admins every Monday morning.
 * Provides a top-level view of support volume and resolution performance.
 * Trigger: scheduled job in the background worker (not a route action).
 */
export function WeeklyDigestEmail({
  adminName, weekStart, weekEnd, ticketsCreated, ticketsResolved,
  avgResolutionHours, openTickets, dashboardUrl,
}: WeeklyDigestEmailProps) {
  const resolutionRate = ticketsCreated > 0
    ? Math.round((ticketsResolved / ticketsCreated) * 100)
    : 0

  return (
    <Html>
      <Head />
      <Preview>Your SparkDesk weekly summary — {weekStart} to {weekEnd}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SparkDesk</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>Weekly summary</Heading>
            <Text style={subtitle}>{weekStart} – {weekEnd}</Text>
            <Text style={text}>Hi {adminName}, here&apos;s how your team did this week.</Text>
            <Section style={statsGrid}>
              <Row>
                <Column style={statCell}>
                  <Text style={statNumber}>{ticketsCreated}</Text>
                  <Text style={statLabel}>Tickets opened</Text>
                </Column>
                <Column style={statCell}>
                  <Text style={statNumber}>{ticketsResolved}</Text>
                  <Text style={statLabel}>Tickets resolved</Text>
                </Column>
              </Row>
              <Row>
                <Column style={statCell}>
                  <Text style={statNumber}>{resolutionRate}%</Text>
                  <Text style={statLabel}>Resolution rate</Text>
                </Column>
                <Column style={statCell}>
                  <Text style={statNumber}>{avgResolutionHours.toFixed(1)}h</Text>
                  <Text style={statLabel}>Avg. resolution time</Text>
                </Column>
              </Row>
            </Section>
            {openTickets > 0 && (
              <Section style={openTicketsBox}>
                <Text style={openTicketsText}>
                  <strong>{openTickets}</strong> ticket{openTickets !== 1 ? 's' : ''} still open heading into next week.
                </Text>
              </Section>
            )}
            <Button style={button} href={dashboardUrl}>View full report</Button>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>You&apos;re receiving this weekly digest because you&apos;re an admin on this SparkDesk workspace.</Text>
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
const subtitle: React.CSSProperties = { fontSize: '14px', color: '#71717a', margin: '0 0 20px' }
const text: React.CSSProperties = { fontSize: '15px', color: '#3f3f46', lineHeight: '24px', margin: '0 0 24px' }
const statsGrid: React.CSSProperties = { margin: '0 0 24px' }
const statCell: React.CSSProperties = { backgroundColor: '#f4f4f5', borderRadius: '8px', padding: '16px', textAlign: 'center', width: '50%' }
const statNumber: React.CSSProperties = { fontSize: '28px', fontWeight: '700', color: '#818CF8', margin: '0 0 4px', lineHeight: '1' }
const statLabel: React.CSSProperties = { fontSize: '12px', color: '#71717a', margin: '0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }
const openTicketsBox: React.CSSProperties = { backgroundColor: '#fefce8', borderRadius: '8px', padding: '14px 20px', margin: '0 0 24px', border: '1px solid #fef08a' }
const openTicketsText: React.CSSProperties = { fontSize: '14px', color: '#713f12', margin: '0' }
const button: React.CSSProperties = { backgroundColor: '#818CF8', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', display: 'inline-block' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0' }
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0' }
