import { Sidebar } from './sidebar'

interface ShellProps {
  children: React.ReactNode
  agentName: string
  agentInitials: string
}

export function Shell({ children, agentName, agentInitials }: ShellProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar agentName={agentName} agentInitials={agentInitials} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
