import type { PlayerSettings } from '../../domain/game/types'

const keyFor = (ownerId: string) => `terrunia:account-settings:${ownerId}`

export const loadAccountSettings = (ownerId: string): PlayerSettings | null => {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(keyFor(ownerId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<PlayerSettings>
    if (
      typeof parsed.reducedMotion === 'boolean' &&
      typeof parsed.soundEnabled === 'boolean' &&
      ['normal', 'large'].includes(parsed.textScale ?? '')
    ) return parsed as PlayerSettings
  } catch {
    return null
  }
  return null
}

export const saveAccountSettings = (ownerId: string, settings: PlayerSettings) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(keyFor(ownerId), JSON.stringify(settings))
}
