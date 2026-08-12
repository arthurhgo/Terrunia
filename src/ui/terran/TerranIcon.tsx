import {
  Anvil,
  BookOpen,
  Compass,
  FlaskConical,
  Shield,
  Sparkles,
  UsersRound,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { TerranLocationDefinition } from '../../content/types'

const iconComponents = {
  book: BookOpen,
  compass: Compass,
  anvil: Anvil,
  shield: Shield,
  clan: UsersRound,
  flask: FlaskConical,
  portal: Sparkles,
} satisfies Record<TerranLocationDefinition['iconId'], ComponentType<LucideProps>>

export function TerranIcon({ iconId, ...props }: LucideProps & { iconId: TerranLocationDefinition['iconId'] }) {
  const Icon = iconComponents[iconId]
  return <Icon {...props} />
}
