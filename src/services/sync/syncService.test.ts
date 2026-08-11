import { beforeEach, describe, expect, it, vi } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { getLatestLocalSave, putLocalSave } from '../../persistence/localSaveRepository'
import { getActiveCloudSaveId } from './cloudProfileRepository'
import { getCloudSave, putCloudSave } from './cloudSaveRepository'
import { loadSynchronizedSave, saveEverywhere } from './syncService'

vi.mock('../../persistence/localSaveRepository', () => ({
  getLatestLocalSave: vi.fn(),
  putLocalSave: vi.fn(),
}))

vi.mock('../firebase/firebase', () => ({
  isFirebaseConfigured: true,
}))

vi.mock('./cloudProfileRepository', () => ({
  getActiveCloudSaveId: vi.fn(),
}))

vi.mock('./cloudSaveRepository', () => ({
  getCloudSave: vi.fn(),
  putCloudSave: vi.fn(),
}))

const makeSave = (ownerId: string, saveId: string, revision = 1) => {
  const save = createNewSave(
    ownerId,
    'Aren',
    'character.terririan.default',
    content,
    '2026-08-11T12:00:00.000Z',
    { saveId, characterId: `${saveId}-character` },
  )
  save.revision = revision
  return save
}

describe('sincronização local-first', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('descobre o save ativo do perfil ao entrar em um dispositivo novo', async () => {
    const cloudSave = makeSave('firebase-user', 'cloud-save', 8)
    vi.mocked(getLatestLocalSave).mockResolvedValue(null)
    vi.mocked(getActiveCloudSaveId).mockResolvedValue('cloud-save')
    vi.mocked(getCloudSave).mockResolvedValue(cloudSave)

    await expect(loadSynchronizedSave('firebase-user')).resolves.toEqual(cloudSave)
    expect(getCloudSave).toHaveBeenCalledWith('firebase-user', 'cloud-save')
    expect(putLocalSave).toHaveBeenCalledWith(cloudSave)
    expect(putCloudSave).not.toHaveBeenCalled()
  })

  it('envia o save local quando ainda não existe cópia na nuvem', async () => {
    const localSave = makeSave('firebase-user', 'local-save', 3)
    vi.mocked(getLatestLocalSave).mockResolvedValue(localSave)
    vi.mocked(getCloudSave).mockResolvedValue(null)

    await expect(loadSynchronizedSave('firebase-user')).resolves.toEqual(localSave)
    expect(getCloudSave).toHaveBeenCalledWith('firebase-user', 'local-save')
    expect(putCloudSave).toHaveBeenCalledWith('firebase-user', localSave)
    expect(getActiveCloudSaveId).not.toHaveBeenCalled()
  })

  it('grava primeiro no dispositivo e depois no Firestore', async () => {
    const save = makeSave('firebase-user', 'active-save', 4)

    await expect(saveEverywhere(save)).resolves.toBe('cloud')
    expect(putLocalSave).toHaveBeenCalledWith(save)
    expect(putCloudSave).toHaveBeenCalledWith('firebase-user', save)
  })
})
