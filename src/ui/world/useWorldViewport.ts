import { useEffect, useState, type RefObject } from 'react'
import { calculateWorldViewport, type WorldViewport } from './worldViewport'

/** One ResizeObserver drives drawing, pointer hit tests and minimap crop. */
export function useWorldViewport(
  stage: RefObject<HTMLElement | null>, worldWidth: number, worldHeight: number,
): WorldViewport {
  const [viewport, setViewport] = useState<WorldViewport>({ width: 384, height: 256 })
  useEffect(() => {
    const element = stage.current
    if (!element) return
    const measure = () => {
      const rect = element.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const next = calculateWorldViewport(rect.width, rect.height, worldWidth, worldHeight)
      setViewport((prev) => prev.width === next.width && prev.height === next.height ? prev : next)
    }
    measure()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(element)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [stage, worldWidth, worldHeight])
  return viewport
}
