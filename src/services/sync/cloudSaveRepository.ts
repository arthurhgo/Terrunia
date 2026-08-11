import type { GameSave } from '../../domain/game/types'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import { getFirebaseApp } from '../firebase/firebase'

export const getCloudSave = async (uid: string, saveId: string) => {
  const app = await getFirebaseApp()
  if (!app) return null
  const { doc, getDoc, getFirestore } = await import('firebase/firestore')
  const snapshot = await getDoc(doc(getFirestore(app), 'users', uid, 'saves', saveId))
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  const save = migrateAndValidateSave(data.payload)
  if (save.ownerId !== uid || save.saveId !== saveId) {
    throw new Error('O save de nuvem não corresponde ao usuário ou ID solicitado.')
  }
  return save
}

export const putCloudSave = async (uid: string, save: GameSave) => {
  const app = await getFirebaseApp()
  if (!app) return
  if (uid !== save.ownerId) throw new Error('O UID autenticado não corresponde ao proprietário do save.')
  const { doc, getFirestore, serverTimestamp, writeBatch } = await import(
    'firebase/firestore'
  )
  const database = getFirestore(app)
  const batch = writeBatch(database)
  batch.set(doc(database, 'users', uid, 'saves', save.saveId), {
    schemaVersion: save.schemaVersion,
    gameVersion: save.gameVersion,
    revision: save.revision,
    updatedAt: save.updatedAt,
    syncedAt: serverTimestamp(),
    payload: save,
  })
  batch.update(doc(database, 'users', uid), {
    activeSaveId: save.saveId,
    lastLoginAt: serverTimestamp(),
  })
  await batch.commit()
}
