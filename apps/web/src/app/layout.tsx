import type { Metadata } from 'next'
import './globals.css'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Providers } from '@/components/providers'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'SparkDesk',
}

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo-org'
const DEMO_AGENT_ID = process.env.DEMO_AGENT_ID ?? 'demo-agent'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body>
        <Providers
          userId={DEMO_AGENT_ID}
          name="Jamie Diaz"
          email="jamie@sparkdesk.io"
          orgId={DEMO_ORG_ID}
        >
          {children}
        </Providers>
      </body>
    </html>
  )
}
