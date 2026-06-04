import { withAuth } from '@workos-inc/authkit-nextjs'
import { Shell } from '@/components/layout/shell'
import { Providers } from '@/components/providers'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo-org'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await withAuth({ ensureSignedIn: true })

  const name =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : (user.email ?? 'Agent')

  const initials = name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Providers userId={user.id} name={name} email={user.email ?? undefined} orgId={DEMO_ORG_ID}>
      <Shell agentName={name} agentInitials={initials}>
        {children}
      </Shell>
    </Providers>
  )
}
