/** Copy-only filter: internal review annotations never appear in gameplay.
 * Catalog definitions and their canonical statuses remain unchanged.
 * This is deliberately conservative: remove complete annotated sentences,
 * not gameplay requirements, numbers, or quest state.
 */
const internalAnnotation = /\b(?:OWNER_DECISION|BALANCE_DRAFT|CONTENT_DRAFT|VISUAL_DRAFT|TBD|TODO)\b/i
const internalBoilerplate = /^(?:hipótese investigativa|a origem definitiva da marca continua não determinada)\.?$/i

export function playerCopy(value: string | undefined | null): string {
  if (!value) return ''
  const sentences = value.trim().split(/(?<=[.!?])\s+|\n+/u)
  return sentences.filter((sentence) => !internalAnnotation.test(sentence) && !internalBoilerplate.test(sentence.trim()))
    .join(' ').replace(/\s{2,}/g, ' ').trim()
}
