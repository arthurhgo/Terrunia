/** Synthesized, original UI sound cues. No music files, backend or gameplay side effects. */
export type GameplayCue = 'roll' | 'hit' | 'critical' | 'blocked' | 'purchase' | 'upgrade' | 'quest' | 'success'
const cues: Record<GameplayCue, readonly [number, number, number]> = {
  roll: [390, 450, 0.08], hit: [155, 95, 0.11], critical: [530, 790, 0.20],
  blocked: [250, 190, 0.08], purchase: [660, 880, 0.13],
  upgrade: [460, 920, 0.21], quest: [520, 780, 0.17], success: [550, 670, 0.10],
}
let context: AudioContext | null = null
export function playGameplaySfx(cue: GameplayCue, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') return
  try {
    context ??= new window.AudioContext()
    if (context.state === 'suspended') void context.resume().catch(() => {})
    const [start, finish, duration] = cues[cue]
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    const now = context.currentTime
    oscillator.type = cue === 'hit' || cue === 'blocked' ? 'triangle' : 'sine'
    oscillator.frequency.setValueAtTime(start, now)
    oscillator.frequency.exponentialRampToValueAtTime(finish, now + duration)
    envelope.gain.setValueAtTime(0.0001, now)
    envelope.gain.exponentialRampToValueAtTime(0.07, now + 0.008)
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(envelope)
    envelope.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.01)
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect() }
  } catch {
    // An unavailable or blocked audio device must never interrupt the game.
  }
}
