/**
 * GameSave and CampaignReset are JSON data. Firestore rejects undefined at any
 * nesting depth, while older IndexedDB saves can still contain optional keys
 * with undefined values. Sanitize only the cloud copy; never mutate the save.
 *
 * Array positions are preserved (undefined elements become null, as in JSON).
 */
export const toFirestorePayload = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return Array.from(value, (entry) =>
      entry === undefined ? null : toFirestorePayload(entry),
    ) as T
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, toFirestorePayload(entry)]),
    ) as T
  }
  return value
}
