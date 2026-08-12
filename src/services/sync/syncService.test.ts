import { beforeEach, describe, expect, it, vi } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { deleteLocalSaves, getLatestLocalSave, putLocalSave, replaceLocalCampaign } from '../../persistence/localSaveRepository'
import { getActiveCampaignReference, getActiveCloudSaveId } from './cloudProfileRepository'
import { getCloudSave, putCloudSave, resetCloudCampaign } from './cloudSaveRepository'
import { requestCampaignReset } from '../../domain/game/campaignReset'
import { loadSynchronizedSave, resetCampaignEverywhere, saveEverywhere } from './syncService'

vi.mock('../../persistence/localSaveRepository', () => ({
  getLatestLocalSave: vi.fn(),
  putLocalSave: vi.fn(),
  replaceLocalCampaign: vi.fn(),
  deleteLocalSaves: vi.fn(),
}))

vi.mock('../firebase/firebase', () => ({
  isFirebaseConfigured: true,
}))

vi.mock('./cloudProfileRepository', () => ({
  getActiveCampaignReference: vi.fn(),
  getActiveCloudSaveId: vi.fn(),
}))

vi.mock('./cloudSaveRepository', () => ({
  getCloudSave: vi.fn(),
  putCloudSave: vi.fn(),
  resetCloudCampaign: vi.fn(),
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
    vi.mocked(getActiveCampaignReference).mockResolvedValue({
      activeSaveId: null,
      activeCampaignId: null,
      campaignGeneration: 0,
    })
  })

  it('descobre o save ativo do perfil ao entrar em um dispositivo novo', async () => {
    const cloudSave = makeSave('firebase-user', 'cloud-save', 8)
    vi.mocked(getLatestLocalSave).mockResolvedValue(null)
    vi.mocked(getActiveCampaignReference).mockResolvedValue({
      activeSaveId: 'cloud-save',
      activeCampaignId: cloudSave.campaignId,
      campaignGeneration: cloudSave.campaignGeneration,
    })
    vi.mocked(getActiveCloudSaveId).mockResolvedValue('cloud-save')
    vi.mocked(getCloudSave).mockResolvedValue(cloudSave)

    await expect(loadSynchronizedSave('firebase-user')).resolves.toEqual(cloudSave)
    expect(getCloudSave).toHaveBeenCalledWith('firebase-user', 'cloud-save')
    expect(replaceLocalCampaign).toHaveBeenCalledWith('firebase-user', cloudSave)
    expect(putCloudSave).not.toHaveBeenCalled()
  })

  it('envia o save local quando ainda não existe cópia na nuvem', async () => {
    const localSave = makeSave('firebase-user', 'local-save', 3)
    vi.mocked(getLatestLocalSave).mockResolvedValue(localSave)
    vi.mocked(getActiveCampaignReference).mockResolvedValue({
      activeSaveId: null,
      activeCampaignId: localSave.campaignId,
      campaignGeneration: localSave.campaignGeneration,
    })
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

  it('invalida a geração antiga na nuvem antes de limpar o save local', async () => {
    const save = makeSave('firebase-user', 'active-save', 4)
    const reset = requestCampaignReset(save, 'campaign-next', '2026-08-12T15:20:00.000Z')
    if (!reset.ok) throw new Error(reset.message)

    await expect(resetCampaignEverywhere(save, reset.value)).resolves.toBe('cloud')
    expect(resetCloudCampaign).toHaveBeenCalledWith(
      'firebase-user',
      'active-save',
      { campaignId: 'campaign-next', campaignGeneration: 1 },
      reset.value,
    )
    expect(deleteLocalSaves).toHaveBeenCalledWith('firebase-user')
    expect(vi.mocked(resetCloudCampaign).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(deleteLocalSaves).mock.invocationCallOrder[0])
  })

  it('não ressuscita save local de uma geração invalidada', async () => {
    const stale = makeSave('firebase-user', 'stale-save', 99)
    const active = makeSave('firebase-user', 'active-save', 1)
    active.campaignId = 'campaign-new'
    active.campaignGeneration = 1
    vi.mocked(getLatestLocalSave).mockResolvedValue(stale)
    vi.mocked(getActiveCampaignReference).mockResolvedValue({
      activeSaveId: active.saveId,
      activeCampaignId: active.campaignId,
      campaignGeneration: active.campaignGeneration,
    })
    vi.mocked(getCloudSave).mockResolvedValue(active)

    await expect(loadSynchronizedSave('firebase-user')).resolves.toEqual(active)
    expect(replaceLocalCampaign).toHaveBeenCalledWith('firebase-user', active)
    expect(putCloudSave).not.toHaveBeenCalledWith('firebase-user', stale)
  })

  it('retorna à criação quando a nova geração ainda não possui personagem', async () => {
    const stale = makeSave('firebase-user', 'stale-save', 99)
    vi.mocked(getLatestLocalSave).mockResolvedValue(stale)
    vi.mocked(getActiveCampaignReference).mockResolvedValue({
      activeSaveId: null,
      activeCampaignId: 'campaign-empty',
      campaignGeneration: 1,
    })
    vi.mocked(getActiveCloudSaveId).mockResolvedValue(null)

    await expect(loadSynchronizedSave('firebase-user')).resolves.toBeNull()
    expect(putCloudSave).not.toHaveBeenCalledWith('firebase-user', stale)
  })

  it('permite salvar normalmente o primeiro Terrírian da nova geração', async () => {
    const fresh = makeSave('firebase-user', 'fresh-save', 1)
    fresh.campaignId = 'campaign-next'
    fresh.campaignGeneration = 1

    await expect(saveEverywhere(fresh)).resolves.toBe('cloud')
    expect(putLocalSave).toHaveBeenCalledWith(fresh)
    expect(putCloudSave).toHaveBeenCalledWith('firebase-user', fresh)
  })
})
