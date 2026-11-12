"use client";
import { useSyncExternalStore } from "react";
import { WEATHER_KINDS, type WeatherKind } from "@/lib/weather";

// A Bangladesh landscape behind the storefront: sky, a tree line of coconut and
// betel-nut palms, fields, and a river with a nouka. Each weather gets its own
// palette and details. The landscape is one static SVG; only the separate
// cloud, fog, rain and heat layers move (GPU-composited transforms/opacity).
// Preview any scene with ?weather=hot|rain|winter|normal and ?night=1|0.

type Palette = {
  sky: [string, string];
  skyNight: [string, string];
  far: string;
  trees: string;
  treesDark: string;
  field: string;
  fieldLine: string;
  river: [string, string];
  bank: string;
};

const PALETTES: Record<WeatherKind, Palette> = {
  normal: { sky: ["#7fbcf5", "#e3f2ff"], skyNight: ["#0b1834", "#2a3f6b"], far: "#a7cdb0", trees: "#3d8a4c", treesDark: "#2c6e3a", field: "#86c56e", fieldLine: "#5fa652", river: ["#6aaed6", "#a7d6ee"], bank: "#4f9b47" },
  hot: { sky: ["#ffa94d", "#ffe7b0"], skyNight: ["#1c1533", "#4b3550"], far: "#d8b57a", trees: "#7c7a3c", treesDark: "#5e5c2c", field: "#e3b866", fieldLine: "#c6923f", river: ["#9fcfd9", "#cfe9ee"], bank: "#b79a4f" },
  rain: { sky: ["#5f7286", "#b4c2d0"], skyNight: ["#111a24", "#2a3846"], far: "#7c968a", trees: "#2f6146", treesDark: "#234c37", field: "#4f8f4b", fieldLine: "#3c773b", river: ["#55788f", "#8eabbd"], bank: "#3e7a3e" },
  winter: { sky: ["#c9d4e0", "#f4f7fa"], skyNight: ["#18202f", "#38465a"], far: "#c4d0c8", trees: "#6f8c76", treesDark: "#5a7462", field: "#f1c73f", fieldLine: "#d9a91c", river: ["#a9c3d4", "#dbe7ef"], bank: "#8faa62" },
};

function subscribeUrl(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
const readKind = (): WeatherKind | null => {
  const value = new URLSearchParams(window.location.search).get("weather");
  return WEATHER_KINDS.find((k) => k === value) ?? null;
};
const readNight = (): boolean | null => {
  const value = new URLSearchParams(window.location.search).get("night");
  return value === "1" ? true : value === "0" ? false : null;
};
const serverNull = () => null;

// Coconut / date palm: a curved trunk and a crown of drooping fronds.
const FRONDS = [[-46, 14], [-40, -8], [-16, -28], [14, -28], [40, -8], [46, 14], [-28, 26], [28, 26]];
function Palm({ x, y, h, lean = 0, color, crown = 1 }: { x: number; y: number; h: number; lean?: number; color: string; crown?: number }) {
  const tx = x + lean;
  const ty = y - h;
  return (
    <g stroke={color} fill="none" strokeLinecap="round">
      <path d={`M${x} ${y}Q${x + lean * 0.2} ${y - h * 0.55} ${tx} ${ty}`} strokeWidth={5} />
      {FRONDS.map(([dx, dy], i) => (
        <path key={i} d={`M${tx} ${ty}Q${tx + dx * crown * 0.5} ${ty + dy * crown * 0.5 - 14} ${tx + dx * crown} ${ty + dy * crown}`} strokeWidth={4} />
      ))}
    </g>
  );
}

// Palmyra (তাল) palm: a straight trunk and a round fan crown.
const FAN = Array.from({ length: 14 }, (_, i) => [Math.round(Math.cos((i / 14) * Math.PI * 2) * 30), Math.round(Math.sin((i / 14) * Math.PI * 2) * 26)]);
function Taal({ x, y, h, color }: { x: number; y: number; h: number; color: string }) {
  const ty = y - h;
  return (
    <g stroke={color} strokeLinecap="round" fill={color}>
      <line x1={x} y1={y} x2={x} y2={ty} strokeWidth={7} />
      <circle cx={x} cy={ty} r={14} />
      {FAN.map(([dx, dy], i) => <line key={i} x1={x} y1={ty} x2={x + dx} y2={ty + dy} strokeWidth={4} />)}
    </g>
  );
}

function RoundTree({ x, y, r, color, trunk }: { x: number; y: number; r: number; color: string; trunk: string }) {
  return (
    <g fill={color}>
      <rect x={x - 3} y={y - r} width={6} height={r} fill={trunk} />
      <circle cx={x} cy={y - r * 1.4} r={r} />
      <circle cx={x - r * 0.65} cy={y - r * 0.95} r={r * 0.7} />
      <circle cx={x + r * 0.65} cy={y - r * 0.95} r={r * 0.7} />
    </g>
  );
}

// নৌকা: an upturned hull, an optional patched sail or a bamboo cover (ছই), and a boatman.
function Boat({ x, y, sail, covered }: { x: number; y: number; sail?: boolean; covered?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {sail && (
        <>
          <line x1={2} y1={2} x2={0} y2={-86} stroke="#5a3d22" strokeWidth={2.5} />
          <path d="M3 -4L1 -80L44 -68L40 -8Z" fill="#ead7aa" stroke="#b89a5e" strokeWidth={1.5} />
          <path d="M2 -42L42 -38" stroke="#c9ad74" strokeWidth={1.5} />
        </>
      )}
      {covered && <path d="M-30 0Q-4 -34 26 0Z" fill="#c9a66b" stroke="#8a6a3a" strokeWidth={1.5} />}
      <path d="M-78 -10C-56 8 -30 12 0 12C30 12 56 8 78 -10C64 -2 40 2 0 2C-40 2 -64 -2 -78 -10Z" fill="#5a3a22" />
      <circle cx={52} cy={-24} r={4} fill="#2b1d12" />
      <line x1={52} y1={-20} x2={50} y2={-4} stroke="#2b1d12" strokeWidth={3} strokeLinecap="round" />
      <line x1={60} y1={-40} x2={74} y2={20} stroke="#3b2a1a" strokeWidth={2} strokeLinecap="round" />
      <ellipse cx={0} cy={18} rx={62} ry={3} fill="#ffffff" opacity={0.25} />
    </g>
  );
}

const STARS = Array.from({ length: 42 }, (_, i) => ({ x: (i * 263) % 1440, y: ((i * 97) % 380) + 12, r: (i % 3) * 0.5 + 0.8 }));

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={0} r={38} />
      <circle cx={42} cy={-16} r={48} />
      <circle cx={92} cy={0} r={36} />
      <rect x={0} y={0} width={92} height={36} rx={18} />
    </g>
  );
}

function CloudLayer({ kind }: { kind: WeatherKind }) {
  const clouds = kind === "rain"
    ? [[60, 120, 1.6], [330, 90, 1.9], [640, 130, 1.7], [930, 100, 2], [1240, 125, 1.7], [1480, 95, 1.8], [190, 200, 1.3], [790, 210, 1.4], [1360, 220, 1.3]]
    : [[90, 110, 1], [520, 70, 0.8], [880, 130, 1.1], [1290, 80, 0.9], [1530, 120, 1]];
  return (
    <div className="ws-layer ws-clouds">
      <svg viewBox="0 0 1700 300" preserveAspectRatio="xMidYMin slice" width="100%" height="100%">
        <g fill={kind === "rain" ? "#55626f" : "#ffffff"}>
          {clouds.map(([x, y, s], i) => <Cloud key={i} x={x} y={y} s={s} />)}
        </g>
      </svg>
    </div>
  );
}

export function WeatherScene({ kind, isDay }: { kind: WeatherKind; isDay: boolean }) {
  const kindOverride = useSyncExternalStore(subscribeUrl, readKind, serverNull);
  const nightOverride = useSyncExternalStore(subscribeUrl, readNight, serverNull);
  const active = kindOverride ?? kind;
  const night = nightOverride ?? !isDay;
  const p = PALETTES[active];
  const [skyTop, skyBottom] = night ? p.skyNight : p.sky;
  const fieldStripes = Array.from({ length: 7 }, (_, i) => 678 + i * 16);

  return (
    <div className="weather-scene" data-kind={active} data-night={night ? "" : undefined} aria-hidden="true">
      <svg className="ws-land" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
        <defs>
          <linearGradient id="ws-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={skyTop} />
            <stop offset="0.72" stopColor={skyBottom} />
          </linearGradient>
          <linearGradient id="ws-river" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.river[0]} />
            <stop offset="1" stopColor={p.river[1]} />
          </linearGradient>
          <radialGradient id="ws-glow">
            <stop offset="0" stopColor={night ? "#fdf8e4" : active === "hot" ? "#fff2b8" : "#fffaf0"} stopOpacity={night ? 0.35 : 0.9} />
            <stop offset="1" stopColor={night ? "#fdf8e4" : "#ffd36b"} stopOpacity={0} />
          </radialGradient>
        </defs>

        <rect width={1440} height={900} fill="url(#ws-sky)" />

        {night && <g fill="#ffffff">{STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={0.75} />)}</g>}

        {night ? (
          <g>
            <circle cx={1080} cy={160} r={120} fill="url(#ws-glow)" />
            <circle cx={1080} cy={160} r={30} fill="#f4f1dc" />
          </g>
        ) : active === "hot" ? (
          <g>
            <circle cx={1080} cy={170} r={240} fill="url(#ws-glow)" />
            <circle cx={1080} cy={170} r={58} fill="#fff4c4" />
          </g>
        ) : active === "winter" ? (
          <g opacity={0.85}>
            <circle cx={1040} cy={360} r={190} fill="url(#ws-glow)" />
            <circle cx={1040} cy={360} r={44} fill="#fff6dc" />
          </g>
        ) : active === "normal" ? (
          <g>
            <circle cx={1100} cy={150} r={170} fill="url(#ws-glow)" />
            <circle cx={1100} cy={150} r={42} fill="#fff7d6" />
            {[[260, 260], [300, 240], [1180, 300]].map(([bx, by], i) => (
              <path key={i} d={`M${bx} ${by}q6 -6 12 0q6 -6 12 0`} stroke="#2d3b45" strokeWidth={2} fill="none" strokeLinecap="round" />
            ))}
          </g>
        ) : null}

        {/* Far hazy tree line */}
        <path d="M0 610C160 585 300 600 420 590C560 578 680 600 820 588C980 575 1120 598 1260 585C1340 578 1400 590 1440 586L1440 900L0 900Z" fill={p.far} />

        {/* Village tree line */}
        <path d="M0 640C200 628 400 645 620 634C840 624 1060 642 1260 632C1360 627 1410 634 1440 632L1440 900L0 900Z" fill={p.trees} />
        {[[160, 640, 34], [330, 642, 28], [700, 634, 38], [880, 630, 30], [1060, 640, 36], [1250, 634, 32], [1400, 634, 26]].map(([x, y, r], i) => (
          <RoundTree key={i} x={x} y={y} r={r} color={p.treesDark} trunk={p.treesDark} />
        ))}
        <Palm x={90} y={642} h={150} lean={10} color={p.treesDark} />
        <Palm x={235} y={640} h={190} lean={-4} color={p.treesDark} crown={0.6} />
        <Palm x={430} y={642} h={160} lean={-12} color={p.treesDark} />
        <Palm x={560} y={636} h={200} lean={3} color={p.treesDark} crown={0.6} />
        <Palm x={990} y={636} h={170} lean={12} color={p.treesDark} />
        <Palm x={1160} y={638} h={140} lean={-8} color={p.treesDark} />
        <Palm x={1330} y={634} h={180} lean={6} color={p.treesDark} crown={0.6} />
        {active === "hot" && (
          <>
            <Taal x={640} y={662} h={190} color={p.treesDark} />
            <Taal x={1210} y={660} h={160} color={p.treesDark} />
          </>
        )}

        {/* Fields: paddy, mustard (winter) or sun-baked earth (hot) */}
        <path d="M0 662C360 650 720 668 1080 656C1260 650 1380 660 1440 656L1440 900L0 900Z" fill={p.field} />
        {fieldStripes.map((y, i) => (
          <path key={i} d={`M0 ${y}C360 ${y - 10} 720 ${y + 8} 1080 ${y - 4}C1260 ${y - 8} 1380 ${y} 1440 ${y - 2}`} stroke={p.fieldLine} strokeWidth={2} fill="none" opacity={0.55} />
        ))}
        {active === "winter" && (
          <>
            {/* খেজুর গাছ with a clay pot collecting the winter juice */}
            <Palm x={610} y={700} h={150} lean={-6} color="#6b5a3a" crown={0.9} />
            <path d="M602 572q8 -10 16 0l-2 16q-6 4 -12 0z" fill="#9c5b33" />
            <Palm x={860} y={706} h={120} lean={8} color="#6b5a3a" crown={0.8} />
            <path d="M864 600q8 -10 16 0l-2 16q-6 4 -12 0z" fill="#9c5b33" />
          </>
        )}
        {active === "hot" && (
          <g stroke="#a87634" strokeWidth={1.6} fill="none" opacity={0.6} strokeLinecap="round">
            <path d="M180 742l30 8l-10 14l34 6" />
            <path d="M520 760l26 -6l8 14l30 -4" />
            <path d="M940 738l-22 12l16 10l-28 8" />
            <path d="M1220 752l30 6l-8 12" />
          </g>
        )}

        {/* River */}
        <path d="M0 792C300 780 600 800 900 788C1150 778 1320 792 1440 786L1440 840C1200 846 900 832 600 842C380 849 180 836 0 842Z" fill="url(#ws-river)" />
        <g stroke="#ffffff" strokeWidth={1.5} opacity={0.45} strokeLinecap="round">
          <line x1={240} y1={812} x2={290} y2={812} />
          <line x1={520} y1={822} x2={560} y2={822} />
          <line x1={980} y1={806} x2={1030} y2={806} />
          <line x1={1240} y1={818} x2={1280} y2={818} />
        </g>
        <Boat x={760} y={806} sail={active === "normal" || active === "hot"} covered={active === "rain" || active === "winter"} />

        {/* Near bank */}
        <path d="M0 842C180 836 380 849 600 842C900 832 1200 846 1440 840L1440 900L0 900Z" fill={p.bank} />

        {night && <rect width={1440} height={900} fill="#0a1430" opacity={0.38} />}
      </svg>

      {(active === "normal" || active === "rain" || active === "winter") && <CloudLayer kind={active} />}
      {active === "winter" && <div className="ws-layer ws-fog" />}
      {active === "rain" && (
        <>
          <div className="ws-layer ws-rain ws-rain-a" />
          <div className="ws-layer ws-rain ws-rain-b" />
        </>
      )}
      {active === "hot" && !night && <div className="ws-layer ws-heat" />}
    </div>
  );
}
