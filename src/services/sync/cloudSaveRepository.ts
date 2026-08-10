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
  return migrateAndValidateSave(data.payload)
}

export const putCloudSave = async (uid: string, save: GameSave) => {
  const app = await getFirebaseApp()
  if (!app) return
  if (uid !== save.ownerId) throw new Error('O UID autenticado não corresponde ao proprietário do save.')
  const { doc, getFirestore, serverTimestamp, setDoc } = await import('firebase/firestore')
  await setDoc(doc(getFirestore(app), 'users', uid, 'saves', save.saveId), {
    schemaVersion: save.schemaVersion,
    gameVersion: save.gameVersion,
    revision: save.revision,
    updatedAt: save.updatedAt,
    syncedAt: serverTimestamp(),
    payload: save,
  })
}
