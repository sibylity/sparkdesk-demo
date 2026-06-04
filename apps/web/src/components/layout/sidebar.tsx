'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { trackNavItemClicked } from '@/analytics/events'

const navItems = [
  { label: 'Inbox', href: '/inbox' },
  { label: 'All tickets', href: '/tickets' },
  { label: 'Mine', href: '/tickets?assignee=me' },
  null, // divider
  { label: 'Customers', href: '/customers' },
  { label: 'Team', href: '/team' },
  { label: 'Integrations', href: '/integrations' },
  null,
  { label: 'Reports', href: '/reports' },
  { label: 'Settings', href: '/settings' },
]

interface SidebarProps {
  agentName: string
  agentInitials: string
}

export function Sidebar({ agentName, agentInitials }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col border-r"
      style={{ width: 208, background: 'var(--bg-panel)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="w-5 h-5 rounded-[4px]" style={{ background: 'var(--accent-color)' }} />
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          SparkDesk
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1.5 space-y-px">
        {navItems.map((item, i) =>
          item === null ? (
            <Separator key={i} className="my-2 opacity-50" />
          ) : (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => trackNavItemClicked({ destination: item.href, label: item.label })}
              className={cn(
                'flex items-center justify-between rounded px-2.5 py-[5px] text-[13px] transition-colors',
                pathname === item.href
                  ? 'font-medium'
                  : 'font-[450]'
              )}
              style={{
                color: pathname === item.href ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: pathname === item.href ? 'var(--bg-hover)' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          )
        )}
      </nav>

      {/* Agent row */}
      <div className="px-2 pb-3.5 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className="flex items-center gap-2.5 rounded px-2.5 py-1.5 cursor-pointer transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent-color)' }}
          >
            {agentInitials}
          </div>
          <span className="text-[12.5px]">{agentName}</span>
          <div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: 'var(--resolved)' }} />
        </div>
      </div>
    </aside>
  )
}
