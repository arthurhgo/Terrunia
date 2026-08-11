import { getFirebaseApp } from '../firebase/firebase'

export type CloudUserIdentity = {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

export const ensureCloudUserProfile = async (identity: CloudUserIdentity) => {
  const app = await getFirebaseApp()
  if (!app) return

  const { doc, getFirestore, runTransaction, serverTimestamp } = await import(
    'firebase/firestore'
  )
  const database = getFirestore(app)
  const profileReference = doc(database, 'users', identity.uid)

  await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(profileReference)
    const identityFields = {
      uid: identity.uid,
      displayName: identity.displayName,
      email: identity.email,
      photoURL: identity.photoURL,
      lastLoginAt: serverTimestamp(),
    }

    if (snapshot.exists()) {
      transaction.update(profileReference, identityFields)
      return
    }

    transaction.set(profileReference, {
      ...identityFields,
      createdAt: serverTimestamp(),
      activeSaveId: null,
    })
  })
}

export const getActiveCloudSaveId = async (uid: string) => {
  const app = await getFirebaseApp()
  if (!app) return null

  const { doc, getDoc, getFirestore } = await import('firebase/firestore')
  const snapshot = await getDoc(doc(getFirestore(app), 'users', uid))
  if (!snapshot.exists()) return null

  const activeSaveId: unknown = snapshot.data().activeSaveId
  return typeof activeSaveId === 'string' && activeSaveId.length > 0
    ? activeSaveId
    : null
}
