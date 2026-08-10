import type { ButtonHTMLAttributes } from 'react'

type GameButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  full?: boolean
}

export function GameButton({
  variant = 'secondary',
  full = false,
  className = '',
  type = 'button',
  ...props
}: GameButtonProps) {
  return (
    <button
      type={type}
      className={`game-button game-button--${variant} ${full ? 'game-button--full' : ''} ${className}`}
      {...props}
    />
  )
}
