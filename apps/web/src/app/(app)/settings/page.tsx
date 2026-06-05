import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api-client'
import { ToggleList } from '@/components/settings/toggle-list'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

export default async function SettingsPage() {
  const { toggles } = await apiClient.settings.getToggles(DEMO_ORG_ID)

  async function handleToggle(key: string, enabled: boolean) {
    'use server'
    await apiClient.settings.patchToggles(DEMO_ORG_ID, { [key]: enabled })
    revalidatePath('/settings')
  }

  return (
    <div className="app-page">
      <div className="mb-6">
        <div className="page-kicker">Controls</div>
        <h1 className="page-title mt-1">Settings</h1>
        <p className="page-copy mt-1">
          Configure workspace features
        </p>
      </div>
      <div className="surface overflow-hidden">
        <ToggleList toggles={toggles} onToggle={handleToggle} />
      </div>
    </div>
  )
}
