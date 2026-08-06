'use client';

/**
 * Self-contained watercolour-style floral decorations.
 *
 * Drawn as inline SVG rather than raster assets so the template ships without
 * external image dependencies and stays crisp at any viewport size.
 */

type FloralProps = { className?: string; style?: React.CSSProperties };

const ROSE = '#D9A3A8';
const ROSE_DEEP = '#B97C86';
const CREAM = '#EBD9C4';
const LEAF = '#A9B79A';
const LEAF_DEEP = '#7F9070';

/** A single layered rose bloom. */
function Rose({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={fill} opacity="0.55" />
      <circle r={r * 0.68} fill={fill} opacity="0.65" />
      <circle r={r * 0.4} fill={ROSE_DEEP} opacity="0.5" />
      <circle r={r * 0.16} fill={ROSE_DEEP} opacity="0.75" />
    </g>
  );
}

/** A soft leaf sprig radiating from a stem point. */
function Sprig({
  x,
  y,
  rotate = 0,
  scale = 1,
}: {
  x: number;
  y: number;
  rotate?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path d="M0 0 C 20 -8, 44 -6, 62 4" stroke={LEAF_DEEP} strokeWidth="1.6" fill="none" opacity="0.7" />
      {[10, 24, 38, 52].map((offset, i) => (
        <g key={offset}>
          <ellipse cx={offset} cy={-9 + i} rx="9" ry="4.5" fill={LEAF} opacity="0.6" transform={`rotate(-28 ${offset} ${-9 + i})`} />
          <ellipse cx={offset} cy={7 - i * 0.5} rx="9" ry="4.5" fill={LEAF} opacity="0.5" transform={`rotate(28 ${offset} ${7 - i * 0.5})`} />
        </g>
      ))}
    </g>
  );
}

/** Floral cluster anchored to the top edge of a section. */
export function FloralTop({ className, style }: FloralProps) {
  return (
    <svg viewBox="0 0 400 150" className={className} style={style} preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <ellipse cx="70" cy="20" rx="120" ry="60" fill={CREAM} opacity="0.45" />
      <ellipse cx="330" cy="16" rx="120" ry="58" fill={CREAM} opacity="0.4" />
      <Sprig x={20} y={54} rotate={18} scale={1.05} />
      <Sprig x={300} y={48} rotate={158} scale={1.1} />
      <Sprig x={150} y={26} rotate={35} scale={0.8} />
      <Rose x={58} y={40} r={24} fill={ROSE} />
      <Rose x={104} y={64} r={15} fill={ROSE_DEEP} />
      <Rose x={22} y={70} r={13} fill={ROSE} />
      <Rose x={338} y={36} r={26} fill={ROSE} />
      <Rose x={296} y={62} r={16} fill={ROSE_DEEP} />
      <Rose x={372} y={70} r={13} fill={ROSE} />
    </svg>
  );
}

/** Floral cluster anchored to the bottom edge of a section. */
export function FloralBottom({ className, style }: FloralProps) {
  return (
    <svg viewBox="0 0 400 160" className={className} style={style} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <ellipse cx="60" cy="150" rx="130" ry="66" fill={CREAM} opacity="0.45" />
      <ellipse cx="340" cy="152" rx="130" ry="62" fill={CREAM} opacity="0.4" />
      <Sprig x={16} y={104} rotate={-20} scale={1.15} />
      <Sprig x={310} y={100} rotate={-158} scale={1.15} />
      <Sprig x={168} y={140} rotate={-32} scale={0.85} />
      <Rose x={62} y={118} r={27} fill={ROSE} />
      <Rose x={112} y={140} r={17} fill={ROSE_DEEP} />
      <Rose x={20} y={144} r={14} fill={ROSE} />
      <Rose x={336} y={116} r={25} fill={ROSE} />
      <Rose x={288} y={142} r={16} fill={ROSE_DEEP} />
      <Rose x={378} y={146} r={13} fill={ROSE} />
    </svg>
  );
}

/** Watercolour gazebo silhouette used as the hero backdrop. */
export function GazeboBackdrop({ className, style }: FloralProps) {
  return (
    <svg viewBox="0 0 400 600" className={className} style={style} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="fv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3E7DA" />
          <stop offset="60%" stopColor="#EFE0D2" />
          <stop offset="100%" stopColor="#E7D6C6" />
        </linearGradient>
      </defs>
      <rect width="400" height="600" fill="url(#fv-sky)" />
      <ellipse cx="200" cy="470" rx="230" ry="120" fill="#DCC9B4" opacity="0.5" />

      {/* Gazebo */}
      <g opacity="0.42" stroke="#9A7B63" fill="none" strokeWidth="2.4">
        <path d="M120 300 Q200 210 280 300" />
        <path d="M120 300 L120 470" />
        <path d="M280 300 L280 470" />
        <path d="M146 316 L146 470" strokeWidth="1.4" />
        <path d="M254 316 L254 470" strokeWidth="1.4" />
        <path d="M104 470 L296 470" strokeWidth="3" />
        <path d="M138 292 Q200 228 262 292" strokeWidth="1.2" />
        <path d="M200 214 L200 196" strokeWidth="1.6" />
        <circle cx="200" cy="190" r="5" />
      </g>

      {/* Distant foliage */}
      <g opacity="0.3">
        <ellipse cx="52" cy="400" rx="62" ry="86" fill={LEAF_DEEP} />
        <ellipse cx="352" cy="392" rx="66" ry="92" fill={LEAF_DEEP} />
        <ellipse cx="98" cy="446" rx="44" ry="56" fill={LEAF} />
        <ellipse cx="308" cy="450" rx="46" ry="54" fill={LEAF} />
      </g>
    </svg>
  );
}

/** Small dove used for the drifting bird animation. */
export function Dove({ className, style }: FloralProps) {
  return (
    <svg viewBox="0 0 40 24" className={className} style={style} aria-hidden="true">
      <path d="M2 14 Q10 4 20 12 Q30 4 38 13" stroke="#9A7B63" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}

/** Butterfly used beside the event timeline. */
export function Butterfly({ className, style }: FloralProps) {
  return (
    <svg viewBox="0 0 32 28" className={className} style={style} aria-hidden="true">
      <ellipse cx="10" cy="10" rx="8.5" ry="6.5" fill={ROSE} opacity="0.75" transform="rotate(-24 10 10)" />
      <ellipse cx="22" cy="10" rx="8.5" ry="6.5" fill={ROSE} opacity="0.75" transform="rotate(24 22 10)" />
      <ellipse cx="11" cy="19" rx="6" ry="4.5" fill={ROSE_DEEP} opacity="0.6" transform="rotate(-16 11 19)" />
      <ellipse cx="21" cy="19" rx="6" ry="4.5" fill={ROSE_DEEP} opacity="0.6" transform="rotate(16 21 19)" />
      <rect x="15.2" y="6" width="1.6" height="16" rx="0.8" fill="#7A5C48" opacity="0.8" />
    </svg>
  );
}
