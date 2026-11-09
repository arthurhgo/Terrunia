/** VISUAL_DRAFT / OWNER_DECISION: palettes are not final clan canon. */
export const CLAN_HALL_MINI_PORTAL_ID = 'clan_castle_mini_portal'
export const CLAN_CASTLE_DEFINITIONS = {
  dunavar: { interiorId: 'interior_clan_dunavar_castle', name: "Castelo Dûn'Avar", tile: 'castle-dunavar', primary: '#3E655C', accent: '#D4B26B', glow: '#E5D799' },
  rustal: { interiorId: 'interior_clan_rustal_castle', name: 'Castelo Rustal', tile: 'castle-rustal', primary: '#633B48', accent: '#D38F62', glow: '#F3BA79' },
  cebios_esti: { interiorId: 'interior_clan_cebios_esti_castle', name: 'Castelo Cebios Esti', tile: 'castle-cebios', primary: '#304D7B', accent: '#C1D2E6', glow: '#85D1FF' },
  estres_do_et: { interiorId: 'interior_clan_estres_do_et_castle', name: 'Castelo Estres do Ét', tile: 'castle-estres', primary: '#5A3C77', accent: '#A3D8C8', glow: '#B5B7FF' },
} as const
export type ClanCastleId = keyof typeof CLAN_CASTLE_DEFINITIONS
export type ClanCastleInteriorId = (typeof CLAN_CASTLE_DEFINITIONS)[ClanCastleId]['interiorId']
export const getClanCastleId = (clanId: string): ClanCastleInteriorId | null =>
  clanId in CLAN_CASTLE_DEFINITIONS ? CLAN_CASTLE_DEFINITIONS[clanId as ClanCastleId].interiorId : null
export const isClanCastleInteriorId = (id: string): id is ClanCastleInteriorId =>
  Object.values(CLAN_CASTLE_DEFINITIONS).some((entry) => entry.interiorId === id)
export const getClanCastleByInteriorId = (id: string) =>
  Object.values(CLAN_CASTLE_DEFINITIONS).find((entry) => entry.interiorId === id)
