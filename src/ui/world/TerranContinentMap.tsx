import { ArrowRight, Compass, EyeOff, MapPin, Mountain, Navigation, ScrollText } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GameSave } from '../../domain/game/types'
import { getContinentSites } from '../../domain/world/continentMap'

const mountains = Array.from({ length: 28 }, (_, i) => ({
  x: 310 + (i * 51) % 345,
  y: 112 + (i * 29) % 122,
  size: 19 + (i * 7) % 23,
}))
const trees = Array.from({ length: 105 }, (_, i) => ({
  x: 220 + (i * 41) % 550,
  y: 255 + (i * 37) % 245,
  size: 5 + (i % 4) * 2,
}))

/** An illustrated, schematic continent map. Locations and fog visibility come from saved progress. */
export function TerranContinentMap({ save }: { save: GameSave }) {
  const navigate = useNavigate()
  const sites = getContinentSites(save)
  const [selectedId, setSelectedId] = useState('terran')
  const selected = sites.find((site) => site.id === selectedId && site.discovered) ?? sites[0]
  const discovered = sites.filter((site) => site.discovered)
  const unknownRegions = sites.filter((site) => !site.discovered && site.type !== 'institution')

  return <div className="terran-continent">
    <div className="terran-continent__canvas">
      <svg className="terran-continent__art" viewBox="0 0 1000 630"
        preserveAspectRatio="xMidYMid slice" role="img"
        aria-label="Mapa cartográfico do continente de Terran com áreas descobertas e névoa de exploração">
        <defs>
          <linearGradient id="terr-sea" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#06101c" /><stop offset=".47" stopColor="#11394a" /><stop offset="1" stopColor="#050c19" />
          </linearGradient>
          <linearGradient id="terr-land" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#967e55" /><stop offset=".22" stopColor="#788461" />
            <stop offset=".54" stopColor="#3f664c" /><stop offset=".82" stopColor="#6c624a" /><stop offset="1" stopColor="#94694f" />
          </linearGradient>
          <linearGradient id="terr-snow" x1="0" y1="0" x2=".6" y2="1">
            <stop stopColor="#f0e8cc" /><stop offset=".42" stopColor="#a1b7bf" /><stop offset="1" stopColor="#506070" />
          </linearGradient>
          <radialGradient id="terr-clear">
            <stop offset=".0" stopColor="black" /><stop offset=".62" stopColor="black" />
            <stop offset="1" stopColor="white" />
          </radialGradient>
          <radialGradient id="terr-vignette">
            <stop offset=".35" stopColor="#060c15" stopOpacity="0" />
            <stop offset="1" stopColor="#03060d" stopOpacity=".82" />
          </radialGradient>
          <pattern id="terr-ripples" width="45" height="35" patternUnits="userSpaceOnUse">
            <path d="M-8 20 Q13 10 33 20 T73 20" fill="none" stroke="#81bbc1" strokeOpacity=".09" strokeWidth="1.3" />
          </pattern>
          <mask id="terr-fog" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="630">
            <rect width="1000" height="630" fill="white" />
            {discovered.filter((site) => site.type !== 'institution').map((site) =>
              <circle key={site.id} cx={site.x * 10} cy={site.y * 6.3}
                r={site.type === 'city' ? 220 : site.type === 'region' ? 165 : 105}
                fill="url(#terr-clear)" />)}
          </mask>
          <filter id="terr-glow"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>
        <rect width="1000" height="630" fill="url(#terr-sea)" />
        <rect width="1000" height="630" fill="url(#terr-ripples)" />
        <g stroke="#28495b" strokeOpacity=".4" fill="none" strokeWidth="1">
          <circle cx="495" cy="315" r="290" strokeDasharray="3 11" />
          <circle cx="495" cy="315" r="240" strokeDasharray="2 12" />
          <path d="M0 315 H1000 M500 0 V630" strokeDasharray="4 13" />
        </g>
        {/* Decorative coastline and geographic contour: no enemy or battle artworks. */}
        <path d="M126 253 L145 222 180 215 196 173 242 175 254 143 299 147 324 107 351 116 392 71 437 90 470 64 510 89 545 81 584 114 614 101 652 137 686 126 720 153 751 141 782 166 798 191 830 201 851 238 882 248 893 283 924 309 908 339 926 365 900 391 915 423 877 451 882 492 841 500 807 538 770 532 736 570 702 551 659 576 622 555 589 576 550 556 506 580 464 568 427 590 380 568 354 588 312 561 277 556 251 517 209 524 189 487 144 486 134 450 105 437 117 397 91 370 104 330 90 296 Z"
          fill="url(#terr-land)" stroke="#d0b47a" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M126 253 L145 222 180 215 196 173 242 175 254 143 299 147 324 107 351 116 392 71 437 90 470 64 510 89 545 81 584 114 614 101 652 137 686 126 720 153 751 141 782 166 798 191 830 201 851 238 882 248 893 283 924 309 908 339 926 365 900 391 915 423 877 451 882 492 841 500 807 538 770 532 736 570 702 551 659 576 622 555 589 576 550 556 506 580 464 568 427 590 380 568 354 588 312 561 277 556 251 517 209 524 189 487 144 486 134 450 105 437 117 397 91 370 104 330 90 296 Z"
          fill="none" stroke="#d8c18d" strokeOpacity=".3" strokeWidth="11" filter="url(#terr-glow)" />
        <g fill="#79946d" stroke="#c4a675" strokeWidth="1.4">
          <path d="M79 395 l-26 19 9 25 20 7 16-23 -4-21Z" />
          <path d="M118 503 l-32 17 8 22 26 13 18-24Z" />
          <path d="M212 563 l-28 20 13 13 19-4 11-18Z" />
          <path d="M643 605 l-23 6 13 10 20-1Z" />
          <path d="M264 85 l-16 15 13 12 17-9Z" />
        </g>
        <path d="M295 185 Q405 147 574 193 L676 245 599 282 432 291 318 239 Z"
          fill="url(#terr-snow)" opacity=".82" />
        <path d="M635 404 Q727 356 890 435 L826 540 705 556 627 508Z"
          fill="#bb936c" opacity=".63" />
        <path d="M190 287 Q244 238 351 290 L396 456 279 514 162 422Z"
          fill="#426d4a" opacity=".68" />
        <path d="M593 245 Q700 210 786 280 L806 372 653 404 584 338Z" fill="#456d50" opacity=".55" />
        <path d="M360 185 Q431 232 461 296 T470 398 Q435 462 487 522" fill="none" stroke="#b8d9d1" strokeWidth="9" opacity=".68" />
        <path d="M360 185 Q431 232 461 296 T470 398 Q435 462 487 522" fill="none" stroke="#377fa3" strokeWidth="5" />
        <path d="M626 169 Q603 260 549 305 T477 394" fill="none" stroke="#96c3c3" strokeWidth="5" opacity=".8" />
        <path d="M439 387 Q549 345 688 290 T803 198" fill="none" stroke="#e3bd7b" strokeOpacity=".64" strokeWidth="3" strokeDasharray="5 7" />
        <path d="M388 401 Q305 431 267 492" fill="none" stroke="#dbc487" strokeOpacity=".5" strokeWidth="2" strokeDasharray="5 8" />
        {mountains.map((peak, i) =>
          <g key={i} opacity=".78">
            <path d={`M${peak.x - peak.size} ${peak.y + peak.size * .55} L${peak.x} ${peak.y - peak.size * .8} L${peak.x + peak.size} ${peak.y + peak.size * .55}Z`}
              fill={i % 3 ? '#5c6570' : '#78858e'} stroke="#c0c2ae" strokeWidth=".7" />
            <path d={`M${peak.x - peak.size * .3} ${peak.y - peak.size * .2} L${peak.x} ${peak.y - peak.size * .8} L${peak.x + peak.size * .42} ${peak.y - peak.size * .14} L${peak.x + peak.size * .03} ${peak.y - peak.size * .25}Z`}
              fill="#d6ddd9" />
          </g>)}
        {trees.map((tree, i) => <g key={i} opacity=".55">
          <path d={`M${tree.x} ${tree.y - tree.size} l${tree.size * .68} ${tree.size * 1.5} h-${tree.size * 1.36}Z`} fill={i % 4 ? '#203f34' : '#17372e'} />
          <path d={`M${tree.x} ${tree.y - tree.size * .6} l${tree.size * .48} ${tree.size} h-${tree.size}Z`} fill="#65805c" />
        </g>)}
        <g transform="translate(440 395)">
          <circle r="40" fill="#d6a854" opacity=".15" />
          <path d="M-19 16 V-9 L-7 -9 V-22 L0 -31 L7 -22 V-9 H19 V16Z" fill="#c1a47b" stroke="#ebca82" strokeWidth="1.5" />
          <rect x="-25" y="15" width="50" height="9" fill="#63523e" stroke="#e0bf85" />
          <path d="M-7 2 L0 -5 L7 2 V16 H-7 Z" fill="#263c4b" />
          <path d="M-19 -9 L-12 -18 L-5 -9 M5 -9 L12 -18 L19 -9" fill="#c0a878" stroke="#ead0a0" />
        </g>
        <g transform="translate(689 280)" opacity=".86">
          <path d="M-22 18 V-10 H-13 V-20 H-3 V-35 L6 -19 H14 V-8 H24 V18Z" fill="#9b8b6c" stroke="#d4c39b" />
          <path d="M-7 18 V3 H8 V18" fill="#334a4b" />
        </g>
        <g transform="translate(790 187)" opacity=".86">
          <path d="M-21 20 L-15 -20 0 -32 15 -18 22 20 -1 6Z" fill="#746d6b" stroke="#bfb5a5" />
          <path d="M-18 20 L-26 25 M18 20 L26 25" fill="none" stroke="#978479" strokeWidth="4" />
        </g>
        {/* Undiscovered land is visually hidden; only save-backed regions clear their surrounding fog. */}
        <g mask="url(#terr-fog)">
          <rect width="1000" height="630" fill="#030711" opacity=".91" />
          <g fill="#a6b8c6" opacity=".1">
            <ellipse cx="870" cy="145" rx="155" ry="40" />
            <ellipse cx="885" cy="330" rx="184" ry="48" />
            <ellipse cx="780" cy="510" rx="170" ry="42" />
            <ellipse cx="278" cy="130" rx="155" ry="35" />
            <ellipse cx="170" cy="480" rx="130" ry="38" />
          </g>
        </g>
        <rect width="1000" height="630" fill="url(#terr-vignette)" pointerEvents="none" />
      </svg>

      <div className="terran-continent__title">
        <span className="eyebrow">CARTOGRAFIA · TERRÚNIA</span>
        <h1>Terran</h1>
        <p>Um continente de histórias e caminhos a descobrir.</p>
      </div>

      {sites.filter((site) => site.discovered).map((site) =>
        <button type="button" key={site.id}
          className={`terran-continent__marker terran-continent__marker--${site.type} ${selected.id === site.id ? 'is-selected' : ''}`}
          style={{ left: `${site.x}%`, top: `${site.y}%` }}
          aria-label={`Selecionar ${site.name} no mapa`}
          aria-pressed={selected.id === site.id}
          title={site.name} onClick={() => setSelectedId(site.id)}>
          <span className="terran-continent__pin">{site.type === 'city' ? <Navigation size={14} /> : site.type === 'ruin' ? <Mountain size={12} /> : <MapPin size={12} />}</span>
          <strong>{site.type !== 'institution' ? site.name : site.name}</strong>
        </button>)}
      {unknownRegions.map((site) =>
        <span key={site.id} className="terran-continent__unknown" style={{ left: `${site.x}%`, top: `${site.y}%` }}
          title="Região não descoberta" aria-label="Região não descoberta">?</span>)}

      <aside className="terran-continent__legend" aria-label="Legenda do mapa">
        <strong><Compass size={16} /> Legenda</strong>
        <span><i className="terran-continent__legend-known" /> Local descoberto</span>
        <span><i className="terran-continent__legend-unknown" /> Região encoberta pela névoa</span>
        <span><EyeOff size={14} /> Explore para revelar caminhos</span>
      </aside>
      <aside className="terran-continent__selection" aria-label="Local selecionado no mapa">
        <small><ScrollText size={13} /> LOCAL DESCOBERTO</small>
        <strong>{selected.name}</strong>
        <p>{selected.description}</p>
        <button type="button" onClick={() => navigate('/play')}>Retornar à exploração <ArrowRight size={15} /></button>
      </aside>
      <div className="terran-continent__rose" aria-hidden="true"><Compass size={53} strokeWidth={1} /><span>N</span></div>
    </div>
    <footer className="terran-continent__footer">
      <span><MapPin size={15} /> {discovered.length} pontos registrados no mapa</span>
      <span>Áreas não visitadas permanecem sob a névoa.</span>
    </footer>
  </div>
}
