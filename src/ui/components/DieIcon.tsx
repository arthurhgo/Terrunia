import type { AttributeDie } from '../../domain/game/types'

type DieIconProps = {
  sides: AttributeDie | 20
  className?: string
  /** Face is for presentation only; damage comes from the combat engine. */
  face?: number
  ariaLabel?: string
}

const geometry: Record<AttributeDie | 20, { outline: string; facets: string[] }> = {
  4: { outline: 'M32 5 L59 54 L5 54Z', facets: ['M32 5 L32 34 L5 54', 'M32 34 L59 54'] },
  6: { outline: 'M13 11 L48 11 L58 22 L58 51 L47 58 L13 58 L6 49 L6 21Z', facets: ['M13 11 L13 49 L47 49 L47 11', 'M6 21 L13 11', 'M47 11 L58 22', 'M13 49 L6 49', 'M47 49 L58 51'] },
  8: { outline: 'M32 4 L59 31 L32 60 L5 31Z', facets: ['M32 4 L32 34 L5 31', 'M32 34 L59 31', 'M32 34 L32 60', 'M5 31 L32 60', 'M59 31 L32 60'] },
  10: { outline: 'M32 4 L55 14 L61 35 L32 60 L3 35 L9 14Z', facets: ['M32 4 L32 39 L3 35', 'M32 39 L61 35', 'M9 14 L32 39 L55 14', 'M32 39 L32 60'] },
  12: { outline: 'M22 4 L42 4 L60 20 L60 43 L42 60 L22 60 L4 43 L4 20Z', facets: ['M22 4 L13 27 L32 42 L51 27 L42 4', 'M4 20 L13 27 L4 43', 'M60 20 L51 27 L60 43', 'M13 27 L51 27', 'M22 60 L32 42 L42 60'] },
  20: { outline: 'M32 3 L53 12 L61 36 L45 57 L19 57 L3 36 L11 12Z', facets: ['M32 3 L32 37 L3 36', 'M32 37 L61 36', 'M11 12 L32 37 L53 12', 'M19 57 L32 37 L45 57', 'M3 36 L19 57', 'M61 36 L45 57'] },
}

/** SVG renders the correct polyhedral silhouette without external image dependencies. */
export function DieIcon({ sides, face, className = '', ariaLabel }: DieIconProps) {
  const paths = geometry[sides]
  return <svg viewBox="0 0 64 64" role="img" aria-label={ariaLabel ?? `Dado d${sides}`}
    className={`die-icon die-icon--d${sides} ${className}`.trim()} xmlns="http://www.w3.org/2000/svg">
    <path className="die-icon__shape" d={paths.outline} />
    {paths.facets.map((facet) => <path className="die-icon__facet" key={facet} d={facet} />)}
    <text x="32" y="38" textAnchor="middle" className="die-icon__number">{face ?? sides}</text>
  </svg>
}
