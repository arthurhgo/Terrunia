import type { GameSave } from '../../domain/game/types'
import { getLatestLocalSave, putLocalSave } from '../../persistence/localSaveRepository'
import { isFirebaseConfigured } from '../firebase/firebase'
import { getCloudSave, putCloudSave } from './cloudSaveRepository'

export type SyncMode = 'local' | 'cloud'

const chooseNewest = (local: GameSave, cloud: GameSave) => {
  if (local.revision !== cloud.revision) return local.revision > cloud.revision ? local : cloud
  return local.updatedAt >= cloud.updatedAt ? local : cloud
}

export const loadSynchronizedSave = async (ownerId: string, saveId?: string) => {
  const local = await getLatestLocalSave(ownerId)
  if (!isFirebaseConfigured || ownerId === 'dev-guest') return local
  const cloudId = saveId ?? local?.saveId
  if (!cloudId) return null
  const cloud = await getCloudSave(ownerId, cloudId)
  if (!cloud) {
    if (local) await putCloudSave(ownerId, local)
    return local
  }
  if (!local) {
    await putLocalSave(cloud)
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
