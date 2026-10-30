/** CONTENT_DRAFT / VISUAL_DRAFT: city landmarks are objects, not new institutions. */
export const terranLandmarks = [
  { id: 'city_fountain', name: 'Fonte das Memórias', kind: 'fountain', point: { x: 384, y: 330 }, halfWidth: 21, top: 12, bottom: 8,
    description: 'A água circula entre pedras gravadas. Terran preserva os relatos de quem retorna do Portal; descansar e recuperar Vida continua sendo um serviço da sua Base.' },
  { id: 'city_contract_board', name: 'Quadro de Encomendas', kind: 'board', point: { x: 288, y: 272 }, halfWidth: 12, top: 20, bottom: 3,
    description: 'Moradores e artesãos pagam por materiais de Astravél. Consulte as encomendas e procure cada responsável para aceitar e entregar pessoalmente.' },
  { id: 'city_herb_garden', name: 'Jardim de Daeryn', kind: 'garden', point: { x: 146, y: 354 }, halfWidth: 23, top: 10, bottom: 8,
    description: 'Liora identifica as plantas enquanto Daeryn compara géis e esporos no alambique. As amostras solicitadas vêm dos monstros de Astravél e das caçadas do Portal.' },
  { id: 'city_ruin_obelisk', name: 'Marco das Ruínas', kind: 'obelisk', point: { x: 600, y: 214 }, halfWidth: 10, top: 29, bottom: 3,
    description: 'Inscrições reagem à passagem dos aventureiros. Fragmentos de Eco comerciais se desprendem de Sentinelas da Ruína; componentes de Infusão continuam reservados à evolução dos Vínculos.' },
  { id: 'city_market_crates', name: 'Cargas do Mercado', kind: 'crates', point: { x: 674, y: 348 }, halfWidth: 18, top: 15, bottom: 5,
    description: 'Neris recebe mercadorias e Ruven repara seus equipamentos de viagem. As encomendas pagam 50% acima do valor comum de venda dos materiais entregues.' },
  { id: 'city_training_yard', name: 'Pátio da Guarda', kind: 'training', point: { x: 570, y: 354 }, halfWidth: 13, top: 23, bottom: 4,
    description: 'Escudos de treino aguardam reparos. Garrik compra quitina dos Louva-Esporos. Procure a Caçada de Esporos no Portal para encontrar essa criatura novamente.' },
] as const

export type TerranLandmark = (typeof terranLandmarks)[number]
export const cityLandmarkFlag = (id: string) => `TerranLandmarkDiscovered:${id}`
