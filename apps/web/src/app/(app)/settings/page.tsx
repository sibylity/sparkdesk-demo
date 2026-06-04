import { withAuth } from '@workos-inc/authkit-nextjs'
import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api-client'
import { ToggleList } from '@/components/settings/toggle-list'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

export default async function SettingsPage() {
  await withAuth({ ensureSignedIn: true })
  const { toggles } = await apiClient.settings.getToggles(DEMO_ORG_ID)

  async function handleToggle(key: string, enabled: boolean) {
    'use server'
    await apiClient.settings.patchToggles(DEMO_ORG_ID, { [key]: enabled })
    revalidatePath('/settings')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[16px] font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Configure workspace features
        </p>
      </div>
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <ToggleList toggles={toggles} onToggle={handleToggle} />
      </div>
    </div>
  )
}
