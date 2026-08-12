import { openDB, type DBSchema } from 'idb'
import type { GameSave } from '../domain/game/types'
import { migrateAndValidateSave } from './saveSchema'

type StoredSave = {
  key: string
  ownerId: string
  saveId: string
  updatedAt: string
  payload: GameSave
}

interface TerruniaDatabase extends DBSchema {
  saves: {
    key: string
    value: StoredSave
    indexes: { byOwner: string; byUpdatedAt: string }
  }
}

const databasePromise = openDB<TerruniaDatabase>('terrunia-local', 1, {
  upgrade(database) {
    const store = database.createObjectStore('saves', { keyPath: 'key' })
    store.createIndex('byOwner', 'ownerId')
    store.createIndex('byUpdatedAt', 'updatedAt')
  },
})

const saveKey = (ownerId: string, saveId: string) => `${ownerId}:${saveId}`

export const putLocalSave = async (save: GameSave) => {
  const validated = migrateAndValidateSave(save)
  const database = await databasePromise
  await database.put('saves', {
    key: saveKey(validated.ownerId, validated.saveId),
    ownerId: validated.ownerId,
    saveId: validated.saveId,
    updatedAt: validated.updatedAt,
    payload: validated,
  })
}

export const getLocalSave = async (ownerId: string, saveId: string) => {
  const database = await databasePromise
  const record = await database.get('saves', saveKey(ownerId, saveId))
  return record ? migrateAndValidateSave(record.payload) : null
}

export const getLatestLocalSave = async (ownerId: string) => {
  const database = await databasePromise
  const records = await database.getAllFromIndex('saves', 'byOwner', ownerId)
  const latest = records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  return latest ? migrateAndValidateSave(latest.payload) : null
}

export const deleteLocalSaves = async (ownerId: string) => {
  const database = await databasePromise
  const transaction = database.transaction('saves', 'readwrite')
  const index = transaction.store.index('byOwner')
  let cursor = await index.openCursor(ownerId)
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await transaction.done
}

export const replaceLocalCampaign = async (ownerId: string, save: GameSave) => {
  const validated = migrateAndValidateSave(save)
  if (validated.ownerId !== ownerId) throw new Error('A nova campanha não pertence ao usuário ativo.')
  const database = await databasePromise
  const transaction = database.transaction('saves', 'readwrite')
  const index = transaction.store.index('byOwner')
  let cursor = await index.openCursor(ownerId)
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await transaction.store.put({
    key: saveKey(validated.ownerId, validated.saveId),
    ownerId: validated.ownerId,
    saveId: validated.saveId,
    updatedAt: validated.updatedAt,
    payload: validated,
  })
  await transaction.done
}
