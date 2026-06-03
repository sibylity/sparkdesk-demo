import { withAuth } from '@workos-inc/authkit-nextjs'
import { Shell } from '@/components/layout/shell'

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
    <Shell agentName={name} agentInitials={initials}>
      {children}
    </Shell>
  )
}
