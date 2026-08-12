import type { GameSave } from '../../domain/game/types'
import { deleteLocalSaves, getLatestLocalSave, putLocalSave, replaceLocalCampaign } from '../../persistence/localSaveRepository'
import { isFirebaseConfigured } from '../firebase/firebase'
import { getActiveCampaignReference, getActiveCloudSaveId } from './cloudProfileRepository'
import { getCloudSave, putCloudSave, resetCloudCampaign } from './cloudSaveRepository'
import type { CampaignReset } from '../../domain/game/campaignReset'

export type SyncMode = 'local' | 'cloud'
export type CampaignSeed = { campaignId: string; campaignGeneration: number }

const chooseNewest = (local: GameSave, cloud: GameSave) => {
  if (local.revision !== cloud.revision) return local.revision > cloud.revision ? local : cloud
  return local.updatedAt >= cloud.updatedAt ? local : cloud
}

export const loadSynchronizedSave = async (ownerId: string, saveId?: string) => {
  const local = await getLatestLocalSave(ownerId)
  if (!isFirebaseConfigured || ownerId === 'dev-guest') return local
  const reference = await getActiveCampaignReference(ownerId)
  const localMatchesActive = local && (
    !reference.activeCampaignId || (
      local.campaignId === reference.activeCampaignId &&
      local.campaignGeneration === reference.campaignGeneration
    )
  )
  const cloudId = saveId ?? (localMatchesActive ? local?.saveId : null) ?? reference.activeSaveId ?? (await getActiveCloudSaveId(ownerId))
  if (!cloudId) return null
  const cloud = await getCloudSave(ownerId, cloudId)
  if (!cloud) {
    if (localMatchesActive) await putCloudSave(ownerId, local)
    return localMatchesActive ? local : null
  }
  if (!localMatchesActive) {
    await replaceLocalCampaign(ownerId, cloud)
    return cloud
  }
  const newest = chooseNewest(local, cloud)
  await putLocalSave(newest)
  await putCloudSave(ownerId, newest)
  return newest
}

export const saveEverywhere = async (save: GameSave): Promise<SyncMode> => {
  await putLocalSave(save)
  if (!isFirebaseConfigured || save.ownerId === 'dev-guest') return 'local'
  await putCloudSave(save.ownerId, save)
  return 'cloud'
}

export const loadCampaignSeed = async (ownerId: string): Promise<CampaignSeed> => {
  if (!isFirebaseConfigured || ownerId === 'dev-guest') {
    const local = await getLatestLocalSave(ownerId)
    return local
      ? { campaignId: local.campaignId, campaignGeneration: local.campaignGeneration }
      : { campaignId: crypto.randomUUID(), campaignGeneration: 0 }
  }
  const reference = await getActiveCampaignReference(ownerId)
  return {
    campaignId: reference.activeCampaignId ?? crypto.randomUUID(),
    campaignGeneration: reference.campaignGeneration,
  }
}

export const resetCampaignEverywhere = async (previous: GameSave, event: CampaignReset): Promise<SyncMode> => {
  if (event.ownerId !== previous.ownerId || event.previousSaveId !== previous.saveId) throw new Error('O evento de reset não corresponde à campanha ativa.')
  const campaign = { campaignId: event.nextCampaignId, campaignGeneration: event.nextCampaignGeneration }
  if (campaign.campaignGeneration <= previous.campaignGeneration) throw new Error('A nova campanha precisa possuir geração superior.')
  if (isFirebaseConfigured && previous.ownerId !== 'dev-guest') {
    await resetCloudCampaign(previous.ownerId, previous.saveId, campaign, event)
    await deleteLocalSaves(previous.ownerId)
    return 'cloud'
  }
  await deleteLocalSaves(previous.ownerId)
  return 'local'
}
