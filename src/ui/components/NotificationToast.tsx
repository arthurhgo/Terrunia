import { useEffect } from 'react'
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react'
import { useGameStore } from '../../state/gameStore'

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: XCircle,
}

export function NotificationToast() {
  const notification = useGameStore((state) => state.notification)
  const clear = useGameStore((state) => state.clearNotification)

  useEffect(() => {
    if (!notification) return undefined
    const timer = window.setTimeout(clear, 5200)
    return () => window.clearTimeout(timer)
  }, [clear, notification])

  if (!notification) return null
  const Icon = icons[notification.tone]
  return (
    <button
      type="button"
      className={`notification notification--${notification.tone}`}
      onClick={clear}
      aria-live="polite"
    >
      <Icon size={21} />
      <span>
        <strong>{notification.title}</strong>
        <small>{notification.message}</small>
      </span>
    </button>
  )
}
