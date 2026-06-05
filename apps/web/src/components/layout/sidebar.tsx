'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  BarChart3,
  Inbox,
  Plug,
  Settings,
  Ticket,
  User,
  Users,
  Zap,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { trackNavItemClicked } from '@/analytics/events'

type SubItem = { label: string; href: string; search?: string }
type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  children?: SubItem[]
}

const navItems: (NavItem | null)[] = [
  { label: 'Inbox', href: '/inbox', icon: Inbox },
  {
    label: 'All tickets',
    href: '/tickets',
    icon: Ticket,
    children: [
      { label: 'My Tickets', href: '/tickets', search: 'assignee=me' },
    ],
  },
  null,
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Team', href: '/team', icon: User },
  { label: 'Integrations', href: '/integrations', icon: Plug },
  null,
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  agentName: string
  agentInitials: string
}

export function Sidebar({ agentName, agentInitials }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (item: NavItem) => {
    if (pathname !== item.href) return false
    // "All tickets" is active only when NOT in a sub-view
    if (item.children) return !item.children.some((c) => c.search && searchParams.toString() === c.search)
    return true
  }

  const isSubActive = (sub: SubItem) => {
    return pathname === sub.href && (!sub.search || searchParams.toString() === sub.search)
  }

  return (
    <aside
      className="flex flex-col"
      style={{
        width: 236,
        background: 'color-mix(in srgb, var(--bg-panel) 92%, transparent)',
        borderRight: '1px solid var(--border-panel)',
        boxShadow: '12px 0 40px #00000024',
      }}
    >
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              background: 'linear-gradient(145deg, var(--accent-strong), var(--accent-color))',
              color: 'var(--bg)',
              boxShadow: '0 10px 28px #38D7C333',
            }}
          >
            <Zap className="size-4 fill-current" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-[760] leading-tight" style={{ color: 'var(--text-primary)' }}>
              SparkDesk
            </div>
            <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              Support command center
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item, i) => {
          if (item === null) return <Separator key={i} className="my-3 opacity-60" />

          const active = isActive(item)
          return (
            <div key={item.href + item.label}>
              <Link
                href={item.href}
                onClick={() => trackNavItemClicked({ destination: item.href, label: item.label })}
                className={cn(
                  'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-all',
                  active ? 'font-semibold' : 'font-medium'
                )}
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: active ? 'var(--bg-selected)' : 'transparent',
                  border: `1px solid ${active ? 'var(--accent-border)' : 'transparent'}`,
                }}
              >
                <item.icon
                  className="size-4 flex-shrink-0 transition-colors"
                  style={{ color: active ? 'var(--accent-color)' : 'var(--text-muted)' }}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>

              {item.children && item.children.map((sub) => {
                const subActive = isSubActive(sub)
                return (
                  <Link
                    key={sub.href + (sub.search ?? '')}
                    href={sub.search ? `${sub.href}?${sub.search}` : sub.href}
                    onClick={() => trackNavItemClicked({ destination: sub.href, label: sub.label })}
                    className="flex items-center gap-2 rounded-lg py-1.5 pl-9 pr-2.5 text-[12.5px] transition-all font-medium"
                    style={{
                      color: subActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      background: subActive ? 'var(--bg-selected)' : 'transparent',
                      border: `1px solid ${subActive ? 'var(--accent-border)' : 'transparent'}`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: subActive ? 'var(--accent-color)' : 'var(--text-muted)' }}
                    />
                    {sub.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="px-3 pb-3.5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
        >
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent-strong)',
              border: '1px solid var(--accent-border)',
            }}
          >
            {agentInitials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {agentName}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Online
            </div>
          </div>
          <div className="ml-auto h-2 w-2 rounded-full" style={{ background: 'var(--resolved)' }} />
        </div>
      </div>
    </aside>
  )
}
