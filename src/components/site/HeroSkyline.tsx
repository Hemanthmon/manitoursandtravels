import React from 'react'

// Illustrated travel landscape along the bottom of the home hero, in brand
// navy + gold: misty mountain ranges, sunrise glow, tea-garden hills, a lake,
// a hilltop temple, trees, birds, and a car driving the winding road.
// Pure SVG, so it stays crisp at any size and costs almost nothing to load.

const GOLD = '#d4a537'

// [x, y, radius, twinkle delay in s]; deterministic so renders match.
const STARS: [number, number, number, number][] = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => {
    const v = Math.sin((i + 1) * n) * 10000
    return v - Math.floor(v)
  }
  return [Math.round(r(12.9898) * 1440), Math.round(10 + r(78.233) * 150), r(37.719) > 0.8 ? 1.6 : 1, Math.round(r(4.1414) * 40) / 10]
})
// Runs along the street in front of the city, then climbs towards the hills.
// Road as cubic segments (same curve as ROAD) so street lights can sit on it.
type Pt = [number, number]
const ROAD_SEGMENTS: [Pt, Pt, Pt, Pt][] = [
  [[-10, 385], [120, 385], [300, 385], [400, 380]],
  [[400, 380], [470, 376], [520, 352], [600, 334]],
  [[600, 334], [690, 318], [770, 320], [850, 314]],
  [[850, 314], [930, 308], [990, 300], [1060, 298]],
]
function onRoad(seg: number, t: number): Pt {
  const [a, b, c, d] = ROAD_SEGMENTS[seg]!
  const u = 1 - t
  const k = (i: 0 | 1) => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i]
  return [k(0), k(1)]
}
// [segment, t] along the road; lights shrink with distance.
const STREET_LIGHTS = ([[0, 0.1], [0, 0.32], [0, 0.55], [0, 0.8], [1, 0.25], [1, 0.7], [2, 0.25], [2, 0.7], [3, 0.3], [3, 0.85]] as const).map(
  ([seg, t]) => {
    const [x, y] = onRoad(seg, t)
    return { x, y, s: 0.55 + ((y - 298) / (385 - 298)) * 0.55 }
  },
)

function StreetLight({ x, y, s }: { x: number; y: number; s: number }) {
  // Pole stands just above the road edge; arm reaches over the road.
  return (
    <g transform={`translate(${x} ${y - 6}) scale(${s})`}>
      <ellipse cx="9" cy="6" fill="url(#ls-lamp-pool)" rx="22" ry="6" />
      <path d="M0 0 V-34 Q0 -38 4 -38 H11" stroke="#9fb3cf" strokeOpacity="0.55" strokeWidth="1.6" />
      <path d="M8 -38.5 h7 l-1.5 3 h-4 Z" fill="#9fb3cf" fillOpacity="0.7" />
      <circle cx="11.5" cy="-34" fill="url(#ls-lamp-glow)" r="14" />
      <circle className="motion-safe:animate-[lamp-flicker_5s_ease-in-out_infinite]" cx="11.5" cy="-34.5" fill="#ffe7a3" r="2" style={{ animationDelay: `${(x % 7) * 0.4}s` }} />
    </g>
  )
}

const ROAD = 'M-10 385 C 120 385 300 385 400 380 C 470 376 520 352 600 334 C 690 318 770 320 850 314 C 930 308 990 300 1060 298'

function Tree({ x, y, s = 1, tone = '#0b1d36' }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 V-14" stroke={GOLD} strokeOpacity="0.35" strokeWidth="1.4" />
      <circle cx="0" cy="-22" fill={tone} r="10" />
      <circle cx="-7" cy="-16" fill={tone} r="7.5" />
      <circle cx="7" cy="-16" fill={tone} r="7.5" />
      <path d="M-14 -16 a7.5 7.5 0 0 1 4 -8 a10 10 0 0 1 19 -4 a7.5 7.5 0 0 1 5 12" stroke={GOLD} strokeOpacity="0.28" strokeWidth="1" />
    </g>
  )
}

function Palm({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M0 0 C 2 -12 1 -24 5 -36" stroke="#0b1d36" strokeWidth="3" />
      <path d="M0 0 C 2 -12 1 -24 5 -36" stroke={GOLD} strokeOpacity="0.3" strokeWidth="1" />
      <path
        d="M5 -36 C -4 -40 -12 -36 -16 -30 M5 -36 C 12 -42 20 -40 24 -34 M5 -36 C 2 -46 -6 -50 -12 -48 M5 -36 C 10 -46 18 -50 22 -48 M5 -36 C 6 -44 6 -50 5 -54"
        stroke={GOLD}
        strokeLinecap="round"
        strokeOpacity="0.45"
        strokeWidth="1.4"
      />
    </g>
  )
}

function Birds({ x, y, s = 1, delay = '0s' }: { x: number; y: number; s?: number; delay?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="motion-safe:animate-[plane-bob_7s_ease-in-out_infinite]" style={{ animationDelay: delay }}>
        <path d="M0 0 q5 -5 10 0 q5 -5 10 0" stroke={GOLD} strokeLinecap="round" strokeOpacity="0.6" strokeWidth="1.3" />
        <path d="M18 -10 q4 -4 8 0 q4 -4 8 0" stroke={GOLD} strokeLinecap="round" strokeOpacity="0.45" strokeWidth="1.1" />
        <path d="M-12 -14 q3.5 -3.5 7 0 q3.5 -3.5 7 0" stroke={GOLD} strokeLinecap="round" strokeOpacity="0.35" strokeWidth="1" />
      </g>
    </g>
  )
}

// Deterministic "random" so lit windows don't change between renders.
function lit(seed: number) {
  const v = Math.sin(seed * 12.9898) * 43758.5453
  return v - Math.floor(v) > 0.55
}

function WindowGrid({ x, y, cols, rows, gapX = 9, gapY = 11, seed }: { x: number; y: number; cols: number; rows: number; gapX?: number; gapY?: number; seed: number }) {
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <rect
          fill={GOLD}
          height="4.5"
          key={`${r}-${c}`}
          opacity={lit(seed * 31 + r * 7 + c) ? 0.8 : 0.14}
          rx="0.6"
          width="4.5"
          x={x + c * gapX}
          y={y + r * gapY}
        />,
      )
    }
  }
  return <>{cells}</>
}

const BLD = '#0f2544'
const EDGE = { stroke: GOLD, strokeOpacity: 0.5, strokeWidth: 1.1 }

const FAR = '#1d3a64'
const FAR_EDGE = { stroke: GOLD, strokeOpacity: 0.22, strokeWidth: 1 }

// Distant buildings behind the city: paler and hazier for depth, with a few
// landmark shapes (dome, gopuram, stepped tower) and a construction crane.
function BackSkyline({ ground: G }: { ground: number }) {
  // [x, width, height]
  const blocks: [number, number, number][] = [
    [0, 30, 150], [24, 40, 196], [70, 30, 130], [128, 36, 176], [168, 26, 118],
    [262, 34, 158], [300, 22, 120], [352, 30, 166], [420, 34, 140], [458, 26, 104], [500, 40, 128],
  ]
  return (
    <g opacity="0.85">
      {blocks.map(([x, w, h], i) => (
        <g key={x}>
          <rect fill={FAR} height={h} width={w} x={x} y={G - h} />
          <rect height={h} width={w} x={x} y={G - h} {...FAR_EDGE} />
          {Array.from({ length: Math.floor((h - 20) / 14) }, (_, r) =>
            Array.from({ length: Math.max(1, Math.floor((w - 8) / 9)) }, (_, c) =>
              lit(i * 53 + r * 5 + c) && lit(i * 17 + r + c * 3) ? (
                <rect fill={GOLD} height="3.5" key={`${r}-${c}`} opacity="0.45" width="3.5" x={x + 5 + c * 9} y={G - h + 10 + r * 14} />
              ) : null,
            ),
          )}
        </g>
      ))}

      {/* Stepped tower with spire */}
      <path d={`M204 ${G} V${G - 150} H214 V${G - 172} H222 V${G - 190} H230 V${G - 172} H238 V${G - 150} H248 V${G}`} fill={FAR} />
      <path d={`M204 ${G} V${G - 150} H214 V${G - 172} H222 V${G - 190} H230 V${G - 172} H238 V${G - 150} H248 V${G} M226 ${G - 190} V${G - 210}`} {...FAR_EDGE} />

      {/* Dome building */}
      <rect fill={FAR} height="70" width="48" x="390" y={G - 70} />
      <path d={`M396 ${G - 70} Q414 ${G - 104} 432 ${G - 70} Z M414 ${G - 96} V${G - 108}`} fill={FAR} {...FAR_EDGE} />

      {/* Gopuram (temple tower) */}
      <path
        d={`M540 ${G} L546 ${G - 50} L582 ${G - 50} L588 ${G} Z M549 ${G - 50} L553 ${G - 80} L575 ${G - 80} L579 ${G - 50} Z M556 ${G - 80} L559 ${G - 102} L569 ${G - 102} L572 ${G - 80} Z`}
        fill={FAR}
        {...FAR_EDGE}
      />
      <circle cx="564" cy={G - 106} fill={GOLD} opacity="0.5" r="2.4" />

      {/* Construction crane */}
      <path
        d={`M100 ${G - 130} V${G - 214} M84 ${G - 206} H160 M100 ${G - 214} L84 ${G - 206} M100 ${G - 214} L140 ${G - 206} M150 ${G - 206} V${G - 186}`}
        stroke={GOLD}
        strokeOpacity="0.3"
        strokeWidth="1.3"
      />
      <rect fill={GOLD} height="6" opacity="0.3" width="8" x="146" y={G - 186} />
      <circle className="motion-safe:animate-pulse" cx="100" cy={G - 216} fill="#ef4444" opacity="0.8" r="1.8" />

      {/* Haze so the back row sits behind the front buildings */}
      <rect fill="#0a1a30" height="230" opacity="0.22" width="600" x="0" y={G - 230} />
    </g>
  )
}

// City on the left: office towers, apartments, a school with its bus, a
// hospital and shops.
function City() {
  const G = 372 // ground line
  return (
    <g>
      <BackSkyline ground={G} />
      {/* Office tower with antenna */}
      <path d={`M60 ${G - 168} V${G - 186}`} stroke={GOLD} strokeOpacity="0.6" strokeWidth="1.2" />
      <circle className="motion-safe:animate-pulse" cx="60" cy={G - 188} fill="#ef4444" r="2" />
      <rect fill={BLD} height="168" width="48" x="36" y={G - 168} />
      <rect height="168" width="48" x="36" y={G - 168} {...EDGE} />
      {[0, 1, 2, 3].map((i) => (
        <path d={`M${45 + i * 10} ${G - 160} V${G - 6}`} key={i} stroke={GOLD} strokeOpacity="0.14" strokeWidth="5" />
      ))}
      <WindowGrid cols={4} rows={13} seed={3} x={43} y={G - 158} gapX={10} gapY={12} />

      {/* Apartment block */}
      <rect fill={BLD} height="112" width="58" x="90" y={G - 112} />
      <rect height="112" width="58" x="90" y={G - 112} {...EDGE} />
      <path d={`M86 ${G - 112} H152`} stroke={GOLD} strokeOpacity="0.6" strokeWidth="1.4" />
      <WindowGrid cols={5} rows={8} seed={7} x={97} y={G - 102} gapX={10} gapY={12} />

      {/* School: main block, gable with clock, sign, flag */}
      <rect fill={BLD} height="64" width="128" x="160" y={G - 64} />
      <rect height="64" width="128" x="160" y={G - 64} {...EDGE} />
      <path d={`M190 ${G - 64} L224 ${G - 92} L258 ${G - 64} Z`} fill="#14305a" />
      <path d={`M190 ${G - 64} L224 ${G - 92} L258 ${G - 64}`} {...EDGE} strokeOpacity={0.7} />
      <circle cx="224" cy={G - 74} fill="#fbf9f4" opacity="0.9" r="7" />
      <path d={`M224 ${G - 74} V${G - 79} M224 ${G - 74} H228`} stroke="#0a1a30" strokeLinecap="round" strokeWidth="1.3" />
      <rect fill={GOLD} height="11" opacity="0.9" rx="2" width="50" x="199" y={G - 58} />
      <text fill="#0a1a30" fontSize="8.5" fontWeight="800" letterSpacing="1.5" textAnchor="middle" x="224" y={G - 49.5}>
        SCHOOL
      </text>
      <rect fill="#0a1a30" height="22" rx="2" width="16" x="216" y={G - 22} />
      <rect height="22" rx="2" width="16" x="216" y={G - 22} {...EDGE} />
      <WindowGrid cols={3} rows={2} seed={11} x={168} y={G - 42} gapX={13} gapY={14} />
      <WindowGrid cols={3} rows={2} seed={13} x={248} y={G - 42} gapX={13} gapY={14} />
      <path d={`M300 ${G} V${G - 84}`} stroke={GOLD} strokeOpacity="0.75" strokeWidth="1.4" />
      <g className="origin-left motion-safe:animate-[plane-bob_3s_ease-in-out_infinite]">
        <path d={`M300 ${G - 84} h20 l-4 6 l4 6 h-20 Z`} fill={GOLD} opacity="0.85" />
      </g>

      {/* School bus parked in front */}
      <g transform={`translate(166 ${G - 20})`}>
        <rect fill={GOLD} height="16" rx="3" width="48" x="0" y="0" />
        {[0, 1, 2, 3].map((i) => (
          <rect fill="#0a1a30" height="5" key={i} rx="1" width="7" x={4 + i * 10} y="3" />
        ))}
        <rect fill="#0a1a30" height="9" rx="1" width="5" x="42" y="3" />
        <circle cx="10" cy="16" fill="#0a1a30" r="3.4" />
        <circle cx="38" cy="16" fill="#0a1a30" r="3.4" />
        <circle cx="47.5" cy="11" fill="#fbf9f4" r="1.4" />
      </g>

      {/* Office block with rooftop sign */}
      <rect fill={BLD} height="132" width="44" x="312" y={G - 132} />
      <rect height="132" width="44" x="312" y={G - 132} {...EDGE} />
      <rect fill={GOLD} height="8" opacity="0.6" width="26" x="321" y={G - 142} />
      <WindowGrid cols={3} rows={10} seed={17} x={319} y={G - 124} gapX={12} gapY={12} />

      {/* Hospital */}
      <rect fill={BLD} height="78" width="64" x="364" y={G - 78} />
      <rect height="78" width="64" x="364" y={G - 78} {...EDGE} />
      <rect fill="#fbf9f4" height="16" rx="2" width="16" x="388" y={G - 100} />
      <path d={`M396 ${G - 97} V${G - 87} M391 ${G - 92} H401`} stroke="#ef4444" strokeLinecap="round" strokeWidth="2.6" />
      <path d={`M396 ${G - 84} V${G - 78}`} stroke={GOLD} strokeOpacity="0.6" />
      <WindowGrid cols={5} rows={5} seed={19} x={371} y={G - 70} gapX={11} gapY={12} />

      {/* Shops with awnings */}
      {[436, 476].map((x, i) => (
        <g key={x}>
          <rect fill={BLD} height="36" width="36" x={x} y={G - 36} />
          <rect height="36" width="36" x={x} y={G - 36} {...EDGE} />
          <path d={`M${x - 3} ${G - 24} h42 l-4 -8 h-34 Z`} fill={GOLD} opacity={i ? 0.55 : 0.75} />
          <rect fill={GOLD} height="10" opacity="0.35" width="22" x={x + 7} y={G - 18} />
        </g>
      ))}

      {/* Street trees and lamps */}
      <Tree s={0.65} x={154} y={G} />
      <Tree s={0.6} x={430} y={G} />
      {[150, 305, 520].map((x) => (
        <g key={x}>
          <path d={`M${x} ${G} V${G - 26} h6`} stroke={GOLD} strokeOpacity="0.5" strokeWidth="1.2" />
          <circle cx={x + 7} cy={G - 25} fill={GOLD} opacity="0.9" r="2" />
        </g>
      ))}
      <path d={`M0 ${G} H560`} stroke={GOLD} strokeOpacity="0.4" strokeWidth="1.2" />
    </g>
  )
}

export const HeroSkyline: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    preserveAspectRatio="xMidYMax slice"
    viewBox="0 0 1440 400"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient cx="0.5" cy="0.5" id="ls-sun" r="0.5">
        <stop offset="0" stopColor={GOLD} stopOpacity="0.55" />
        <stop offset="0.45" stopColor={GOLD} stopOpacity="0.18" />
        <stop offset="1" stopColor={GOLD} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="ls-far" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#36557f" stopOpacity="0.55" />
        <stop offset="1" stopColor="#173257" stopOpacity="0.15" />
      </linearGradient>
      <linearGradient id="ls-mid" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#1f3d66" stopOpacity="0.9" />
        <stop offset="1" stopColor="#10264a" stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id="ls-near" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#14305a" />
        <stop offset="1" stopColor="#0a1a30" />
      </linearGradient>
      {/* Sunlit faces: bright at the ridge, fading down into the mist. */}
      <linearGradient id="ls-facet" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={GOLD} stopOpacity="1" />
        <stop offset="1" stopColor={GOLD} stopOpacity="0" />
      </linearGradient>
      <linearGradient id="ls-mist" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fbf9f4" stopOpacity="0" />
        <stop offset="0.5" stopColor="#fbf9f4" stopOpacity="0.07" />
        <stop offset="1" stopColor="#fbf9f4" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="ls-lake" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={GOLD} stopOpacity="0.28" />
        <stop offset="1" stopColor="#274469" stopOpacity="0.5" />
      </linearGradient>
      <radialGradient id="ls-lamp-glow">
        <stop offset="0" stopColor="#ffd77a" stopOpacity="0.7" />
        <stop offset="1" stopColor="#ffd77a" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ls-lamp-pool">
        <stop offset="0" stopColor="#ffd77a" stopOpacity="0.32" />
        <stop offset="1" stopColor="#ffd77a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="ls-fade" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0.72" stopColor="#081426" stopOpacity="0" />
        <stop offset="1" stopColor="#081426" stopOpacity="0.95" />
      </linearGradient>
    </defs>

    {/* Twinkling stars in the night sky */}
    {STARS.map(([x, y, r, d]) => (
      <circle
        className="motion-safe:animate-[twinkle_4s_ease-in-out_infinite]"
        cx={x}
        cy={y}
        fill="#fbf9f4"
        key={`${x}-${y}`}
        opacity="0.5"
        r={r}
        style={{ animationDelay: `${d}s` }}
      />
    ))}

    {/* Sunrise glow on the horizon */}
    <ellipse cx="1000" cy="214" fill="url(#ls-sun)" rx="260" ry="120" />
    <circle cx="1000" cy="214" fill={GOLD} opacity="0.22" r="34" />
    <circle cx="1000" cy="214" opacity="0.45" r="34" stroke={GOLD} strokeWidth="1.2" />

    {/* Birds and a distant plane */}
    <Birds delay="1.5s" s={0.8} x={860} y={70} />
    <Birds delay="3s" s={0.7} x={1180} y={120} />
    <path d="M1236 132 C 1280 112 1320 92 1366 70" opacity="0.35" stroke={GOLD} strokeDasharray="2 6" strokeWidth="1.2" />
    <g transform="translate(1372 66) rotate(-24) scale(0.55)">
      <g className="motion-safe:animate-[plane-bob_6s_ease-in-out_infinite]">
        <path d="M-26 0 Q-26 -4 -18 -4 L18 -4 Q30 -4 32 0 Q30 4 18 4 L-18 4 Q-26 4 -26 0 Z" fill="#fbf9f4" opacity="0.85" />
        <path d="M-4 -3 L-14 -20 L-7 -20 L8 -3 Z M-4 3 L-14 20 L-7 20 L8 3 Z" fill="#fbf9f4" opacity="0.85" />
      </g>
    </g>

    {/* Far mountain range with gold-lit ridges */}
    <path
      d="M0 236 L64 214 Q86 204 100 210 L168 172 Q180 165 191 171 L252 206 L322 148 Q332 140 344 148 L420 202 L488 168 Q498 162 508 166 L598 124 Q610 116 622 124 L700 188 L778 160 Q788 154 798 158 L898 108 Q910 100 922 108 L1010 174 L1080 148 Q1090 142 1100 146 L1180 118 Q1192 110 1204 118 L1290 176 L1360 154 Q1370 148 1380 152 L1440 168 L1440 400 L0 400 Z"
      fill="url(#ls-far)"
    />
    <path
      d="M0 236 L64 214 Q86 204 100 210 L168 172 Q180 165 191 171 L252 206 L322 148 Q332 140 344 148 L420 202 L488 168 Q498 162 508 166 L598 124 Q610 116 622 124 L700 188 L778 160 Q788 154 798 158 L898 108 Q910 100 922 108 L1010 174 L1080 148 Q1090 142 1100 146 L1180 118 Q1192 110 1204 118 L1290 176 L1360 154 Q1370 148 1380 152 L1440 168"
      opacity="0.3"
      stroke={GOLD}
      strokeWidth="1.2"
    />
    {/* Sunlit right-hand faces of the main peaks */}
    <g>
      <path d="M332 141 L344 148 L420 202 L380 204 Z" fill="url(#ls-facet)" opacity="0.14" />
      <path d="M610 117 L622 124 L700 188 L652 190 Z" fill="url(#ls-facet)" opacity="0.16" />
      <path d="M910 101 L922 108 L1010 174 L956 178 Z" fill="url(#ls-facet)" opacity="0.24" />
      <path d="M1192 111 L1204 118 L1290 176 L1240 178 Z" fill="url(#ls-facet)" opacity="0.2" />
      <path d="M180 166 L191 171 L252 206 L214 208 Z" fill="url(#ls-facet)" opacity="0.12" />
    </g>
    {/* Mist between the ranges */}
    <rect fill="url(#ls-mist)" height="70" width="1440" y="200" />

    {/* Middle range */}
    <path
      d="M0 280 C 80 250 150 236 230 252 C 310 268 360 226 450 222 C 540 218 600 262 690 258 C 780 254 840 214 930 216 C 1020 218 1080 260 1170 254 C 1260 248 1330 228 1440 236 L1440 400 L0 400 Z"
      fill="url(#ls-mid)"
    />
    <path
      d="M0 280 C 80 250 150 236 230 252 C 310 268 360 226 450 222 C 540 218 600 262 690 258 C 780 254 840 214 930 216 C 1020 218 1080 260 1170 254 C 1260 248 1330 228 1440 236"
      opacity="0.22"
      stroke={GOLD}
      strokeWidth="1"
    />
    <rect fill="url(#ls-mist)" height="50" width="1440" y="250" />

    {/* Hilltop temple on the right range */}
    <g transform="translate(1158 252)">
      <path d="M-14 0 L-10 -18 L10 -18 L14 0 Z M-8 -18 L-5 -30 L5 -30 L8 -18 Z M-3 -30 L-1.5 -38 L1.5 -38 L3 -30 Z" fill="#10264a" />
      <path
        d="M-14 0 L-10 -18 L10 -18 L14 0 Z M-8 -18 L-5 -30 L5 -30 L8 -18 Z M-3 -30 L-1.5 -38 L1.5 -38 L3 -30 Z M0 -38 V-46 L7 -43 L0 -40"
        opacity="0.6"
        stroke={GOLD}
        strokeWidth="1"
      />
    </g>

    {/* Lake with shimmering reflections */}
    <path d="M480 340 C 570 322 730 318 880 330 C 780 350 610 356 480 340 Z" fill="url(#ls-lake)" />
    {[
      [570, 332, 60],
      [670, 338, 90],
      [770, 331, 50],
      [620, 345, 40],
    ].map(([x, y, w]) => (
      <path d={`M${x} ${y} h${w}`} key={`${x}-${y}`} opacity="0.5" stroke={GOLD} strokeLinecap="round" strokeWidth="1.2" />
    ))}

    {/* Near hills (the city stands on the left one) */}
    <path d="M0 330 C 100 290 220 282 330 306 C 420 326 470 340 560 334 L560 400 L0 400 Z" fill="url(#ls-near)" />
    <path d="M0 330 C 100 290 220 282 330 306 C 420 326 470 340 560 334" opacity="0.45" stroke={GOLD} strokeWidth="1.3" />
    <path d="M860 340 C 960 300 1060 290 1160 300 C 1270 312 1360 300 1440 290 L1440 400 L860 400 Z" fill="url(#ls-near)" />
    <path d="M860 340 C 960 300 1060 290 1160 300 C 1270 312 1360 300 1440 290" opacity="0.4" stroke={GOLD} strokeWidth="1.2" />

    {/* City on the left, scaled to 75% around its ground line so it sits low under the hero text */}
    <g transform="translate(0 93) scale(0.75)">
      <City />
    </g>

    {/* Winding road with a car driving along it */}
    <path d={ROAD} opacity="0.4" stroke={GOLD} strokeLinecap="round" strokeWidth="9" />
    <path d={ROAD} stroke="#0a1a30" strokeLinecap="round" strokeWidth="7" />
    <path d={ROAD} opacity="0.7" stroke={GOLD} strokeDasharray="7 9" strokeWidth="1.1" />
    <g>
      <g transform="translate(-9 -7)">
        <rect fill="#fbf9f4" height="8" rx="2.5" width="18" x="0" y="0" />
        <rect fill="#0a1a30" height="3" rx="1" width="5" x="3" y="1.5" />
        <rect fill="#0a1a30" height="3" rx="1" width="5" x="10" y="1.5" />
        <circle cx="4.5" cy="8.5" fill="#0a1a30" r="2" />
        <circle cx="13.5" cy="8.5" fill="#0a1a30" r="2" />
        <circle cx="18" cy="4.5" fill={GOLD} r="1.2" />
      </g>
      <animateMotion dur="22s" path={ROAD} repeatCount="indefinite" rotate="auto" />
    </g>

    {/* Street lights along the road */}
    {STREET_LIGHTS.map((lamp) => (
      <StreetLight key={`${lamp.x}-${lamp.y}`} {...lamp} />
    ))}

    {/* Trees and palms */}
    <Tree s={1.1} x={420} y={340} />
    <Palm s={1.1} x={500} y={346} />
    <Palm flip s={0.9} x={530} y={350} />
    <Tree s={0.8} x={900} y={330} />
    <Tree s={1} x={950} y={322} />
    <Palm s={1.2} x={1250} y={318} />
    <Tree s={0.9} x={1320} y={314} />
    <Tree s={0.75} x={1370} y={308} />
    <Palm flip s={1} x={1410} y={312} />

    {/* Foreground grass edge, fading into the section below */}
    <path d="M0 396 C 200 395 420 395 720 384 C 1000 376 1240 386 1440 378 L1440 400 L0 400 Z" fill="#081426" opacity="0.85" />
    <rect fill="url(#ls-fade)" height="400" width="1440" />
  </svg>
)
