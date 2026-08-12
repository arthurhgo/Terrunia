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
      const data = snapshot.data()
      transaction.update(profileReference, {
        ...identityFields,
        activeCampaignId: data.activeCampaignId ?? null,
        campaignGeneration: Number(data.campaignGeneration ?? 0),
      })
      return
    }

    transaction.set(profileReference, {
      ...identityFields,
      createdAt: serverTimestamp(),
      activeSaveId: null,
      activeCampaignId: null,
      campaignGeneration: 0,
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

export type ActiveCampaignReference = {
  activeSaveId: string | null
  activeCampaignId: string | null
  campaignGeneration: number
}

export const getActiveCampaignReference = async (uid: string): Promise<ActiveCampaignReference> => {
  const app = await getFirebaseApp()
  if (!app) return { activeSaveId: null, activeCampaignId: null, campaignGeneration: 0 }
  const { doc, getDoc, getFirestore } = await import('firebase/firestore')
  const snapshot = await getDoc(doc(getFirestore(app), 'users', uid))
  if (!snapshot.exists()) return { activeSaveId: null, activeCampaignId: null, campaignGeneration: 0 }
  const data = snapshot.data()
  return {
    activeSaveId: typeof data.activeSaveId === 'string' ? data.activeSaveId : null,
    activeCampaignId: typeof data.activeCampaignId === 'string' ? data.activeCampaignId : null,
    campaignGeneration: typeof data.campaignGeneration === 'number' ? data.campaignGeneration : 0,
  }
}
