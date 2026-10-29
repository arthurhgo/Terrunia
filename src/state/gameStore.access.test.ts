import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { content } from '../content/catalog'
import { createNewSave } from '../domain/game/createSave'
import { loadCampaignSeed, loadSynchronizedSave, saveEverywhere } from '../services/sync/syncService'
import { useGameStore } from './gameStore'

vi.mock('../services/sync/syncService', () => ({
  loadCampaignSeed: vi.fn(),
  loadSynchronizedSave: vi.fn(),
  resetCampaignEverywhere: vi.fn(),
  saveEverywhere: vi.fn(),
}))

const makeSave = () => createNewSave(
  'account-owner',
  'Nira',
  'character.terririan.default',
  content,
  '2026-10-29T10:00:00.000Z',
  { saveId: 'account-save', characterId: 'account-character' },
)

describe('acesso ao personagem único da conta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(saveEverywhere).mockResolvedValue('local')
    vi.mocked(loadCampaignSeed).mockResolvedValue({ campaignId: 'campaign-seed', campaignGeneration: 0 })
  })

  afterEach(() => useGameStore.getState().resetSession())

  it('não aceita a resposta tardia de um boot de outra conta', async () => {
    const first = makeSave()
    let deliver!: (save: typeof first) => void
    vi.mocked(loadSynchronizedSave).mockImplementationOnce(() =>
      new Promise((resolve) => { deliver = resolve }))
    vi.mocked(loadSynchronizedSave).mockResolvedValueOnce(null)
    const oldBoot = useGameStore.getState().boot('account-owner')
    await useGameStore.getState().boot('new-owner')
    deliver(first)
    await oldBoot
    expect(useGameStore.getState().ownerId).toBe('new-owner')
    expect(useGameStore.getState().save).toBeNull()
  })

  it('exige uma decisão a cada novo boot quando existe personagem salvo', async () => {
    const save = makeSave()
    vi.mocked(loadSynchronizedSave).mockResolvedValue(save)

    await useGameStore.getState().boot(save.ownerId)

    expect(useGameStore.getState().save).toBe(save)
    expect(useGameStore.getState().characterAccess).toBe('required')
  })

  it('libera a campanha somente depois de continuar com o personagem', () => {
    const save = makeSave()
    useGameStore.setState({ ownerId: save.ownerId, save, characterAccess: 'required' })

    useGameStore.getState().continueCharacter()

    expect(useGameStore.getState().characterAccess).toBe('granted')
  })

  it('bloqueia criação direta de um segundo personagem ativo', async () => {
    const save = makeSave()
    useGameStore.setState({ ownerId: save.ownerId, save, characterAccess: 'granted' })

    await expect(useGameStore.getState().createGame('Outro', 'character.terririan.sigil'))
      .resolves.toBe(false)
    expect(useGameStore.getState().save).toBe(save)
    expect(saveEverywhere).not.toHaveBeenCalled()
  })

  it('envia contas sem personagem diretamente para a criação', async () => {
    vi.mocked(loadSynchronizedSave).mockResolvedValue(null)

    await useGameStore.getState().boot('account-owner')

    expect(useGameStore.getState().save).toBeNull()
    expect(useGameStore.getState().characterAccess).toBe('creating')
  })
})
