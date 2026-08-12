import type { GameSave } from '../../domain/game/types'
import type { CampaignReset } from '../../domain/game/campaignReset'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import { getFirebaseApp } from '../firebase/firebase'

export const getCloudSave = async (uid: string, saveId: string) => {
  const app = await getFirebaseApp()
  if (!app) return null
  const { doc, getDoc, getFirestore } = await import('firebase/firestore')
  const snapshot = await getDoc(doc(getFirestore(app), 'users', uid, 'saves', saveId))
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  if (data.invalidated === true) return null
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
  const { doc, getFirestore, runTransaction, serverTimestamp } = await import(
    'firebase/firestore'
  )
  const database = getFirestore(app)
  const profileReference = doc(database, 'users', uid)
  await runTransaction(database, async (transaction) => {
    const profile = await transaction.get(profileReference)
    const activeGeneration = Number(profile.data()?.campaignGeneration ?? 0)
    if (save.campaignGeneration < activeGeneration) {
      throw new Error('Esta campanha foi invalidada por um reset realizado em outro dispositivo.')
    }
    const activeCampaignId = profile.data()?.activeCampaignId
    if (activeCampaignId && activeGeneration === save.campaignGeneration && activeCampaignId !== save.campaignId) {
      throw new Error('A campanha local não corresponde à campanha ativa na nuvem.')
    }
    transaction.set(doc(database, 'users', uid, 'saves', save.saveId), {
      schemaVersion: save.schemaVersion,
      gameVersion: save.gameVersion,
      revision: save.revision,
      updatedAt: save.updatedAt,
      syncedAt: serverTimestamp(),
      payload: save,
      campaignId: save.campaignId,
      campaignGeneration: save.campaignGeneration,
      invalidated: false,
    })
    transaction.update(profileReference, {
      activeSaveId: save.saveId,
      activeCampaignId: save.campaignId,
      campaignGeneration: save.campaignGeneration,
      lastLoginAt: serverTimestamp(),
    })
  })
}

export const resetCloudCampaign = async (
  uid: string,
  previousSaveId: string,
  campaign: { campaignId: string; campaignGeneration: number },
  event: CampaignReset,
) => {
  const app = await getFirebaseApp()
  if (!app) return
  const { doc, getFirestore, runTransaction, serverTimestamp } = await import('firebase/firestore')
  const database = getFirestore(app)
  const profileReference = doc(database, 'users', uid)
  const previousReference = doc(database, 'users', uid, 'saves', previousSaveId)
  await runTransaction(database, async (transaction) => {
    const profile = await transaction.get(profileReference)
    const currentGeneration = Number(profile.data()?.campaignGeneration ?? 0)
    if (campaign.campaignGeneration <= currentGeneration) throw new Error('A geração da nova campanha precisa superar a anterior.')
    const previous = await transaction.get(previousReference)
    if (previous.exists()) {
      const previousData = previous.data()
      const migratedPayload = migrateAndValidateSave(previousData.payload)
      transaction.set(previousReference, {
        ...previousData,
        schemaVersion: migratedPayload.schemaVersion,
        gameVersion: migratedPayload.gameVersion,
        revision: migratedPayload.revision,
        updatedAt: migratedPayload.updatedAt,
        payload: migratedPayload,
        campaignId: migratedPayload.campaignId,
        campaignGeneration: migratedPayload.campaignGeneration,
        invalidated: true,
        invalidatedAt: serverTimestamp(),
        resetEvent: event,
      })
    }
    transaction.update(profileReference, {
      activeSaveId: null,
      activeCampaignId: campaign.campaignId,
      campaignGeneration: campaign.campaignGeneration,
      lastLoginAt: serverTimestamp(),
    })
  })
}
