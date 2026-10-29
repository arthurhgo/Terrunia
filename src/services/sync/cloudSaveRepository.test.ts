import { beforeEach, describe, expect, it, vi } from 'vitest'
import { content } from '../../content/catalog'
import { createBattle } from '../../domain/combat/engine'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { putCloudSave } from './cloudSaveRepository'

const firestore = vi.hoisted(() => ({
  set: vi.fn(),
  update: vi.fn(),
  get: vi.fn(async () => ({ data: () => ({ campaignGeneration: 0 }) })),
}))

vi.mock('../firebase/firebase', () => ({ getFirebaseApp: vi.fn(async () => ({})) }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_database, ...path: string[]) => path.join('/')),
  getFirestore: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => 'server-time'),
  runTransaction: vi.fn(async (_database, operation) => operation(firestore)),
}))

describe('gravação do save no Firestore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    firestore.get.mockResolvedValue({ data: () => ({ campaignGeneration: 0 }) })
  })

  it('recupera sincronização de save legado com campo indefinido dentro da batalha', async () => {
    const save = createNewSave('owner_1', 'Aren', 'character.terririan.default', content)
    const bound = bindPrologueWeapon(save, content)
    if (!bound.ok) throw new Error(bound.message)
    const playable = bound.value
    playable.battle = createBattle(playable, content.encounters.encounter_fungorro_01, content)
    const crawler = playable.battle.combatants.combatant_enemy_fungorro_crawler_1
    crawler.aiSkillEveryRounds = undefined

    await expect(putCloudSave(playable.ownerId, playable)).resolves.toBeUndefined()

    const savedDocument = firestore.set.mock.calls[0]?.[1]
    expect(savedDocument.payload.battle.combatants.combatant_enemy_fungorro_crawler_1)
      .not.toHaveProperty('aiSkillEveryRounds')
    expect(savedDocument.payload.saveId).toBe(playable.saveId)
    expect(crawler).toHaveProperty('aiSkillEveryRounds') // Local save untouched.
    expect(firestore.update).toHaveBeenCalledOnce()
  })

  it('rejeita um segundo personagem ativo na mesma conta e geração', async () => {
    const save = createNewSave('owner_1', 'Aren', 'character.terririan.default', content)
    firestore.get.mockResolvedValue({
      data: () => ({
        activeSaveId: 'outro-save',
        activeCampaignId: save.campaignId,
        campaignGeneration: save.campaignGeneration,
      }),
    })

    await expect(putCloudSave(save.ownerId, save)).rejects.toThrow(
      'Esta conta já possui outro Terrírian ativo nesta geração de campanha.',
    )
    expect(firestore.set).not.toHaveBeenCalled()
    expect(firestore.update).not.toHaveBeenCalled()
  })
})
