import { useState } from 'react';

/* ─────────────────────── Design palette ─────────────────────── */
const PALETTE = [
  '#3457D5', '#FFB020', '#14b8a6', '#8b5cf6',
  '#ef4444', '#ec4899', '#f97316', '#22c55e',
];

const CHART_H   = 240;   // inner chart area height
const CHART_W   = 560;   // inner chart area width
const PAD_L     = 54;    // left  padding (y-axis labels)
const PAD_B     = 44;    // bottom padding (x-axis labels)
const PAD_T     = 16;    // top padding
const PAD_R     = 16;    // right padding
const VW        = PAD_L + CHART_W + PAD_R;
const VH        = PAD_T + CHART_H + PAD_B;

/* ─────────────────── Helper: nice tick values ─────────────────── */
function niceTicks(max, count = 5) {
  if (max === 0) return [0];
  const rough = max / count;
  const pow   = Math.pow(10, Math.floor(Math.log10(rough)));
  const nice  = [1, 2, 2.5, 5, 10].find(n => n * pow >= rough) * pow;
  const ticks = [];
  for (let v = 0; v <= max + nice * 0.5; v += nice) ticks.push(parseFloat(v.toFixed(10)));
  return ticks;
}

function fmtVal(v) {
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(1) + 'K';
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

/* ─────────────────────── Tooltip ─────────────────────── */
function Tooltip({ x, y, label, value, color }) {
  const W = 130, H = 52;
  // keep tooltip inside the viewBox
  const tx = Math.min(Math.max(x - W / 2, 2), VW - W - 2);
  const ty = y - H - 10 < PAD_T ? y + 14 : y - H - 10;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={tx} y={ty} width={W} height={H} rx={8}
        fill="#10192E" opacity={0.93} />
      <rect x={tx} y={ty} width={4} height={H} rx={2} fill={color} />
      <text x={tx + 14} y={ty + 18} fontSize={10} fill="rgba(255,255,255,0.55)"
        fontFamily="'Work Sans',sans-serif">{label}</text>
      <text x={tx + 14} y={ty + 36} fontSize={14} fontWeight={700} fill="#fff"
        fontFamily="'Space Mono',monospace">{fmtVal(value)}</text>
    </g>
  );
}

/* ──────────────────────── BAR CHART ──────────────────────── */
function BarChart({ data, max, ticks, onHover, hoverIdx }) {
  const barW = Math.min(36, (CHART_W / data.length) * 0.55);
  const step  = CHART_W / data.length;

  return (
    <>
      {/* Grid lines */}
      {ticks.map(t => {
        const y = PAD_T + CHART_H - (t / (ticks[ticks.length - 1] || 1)) * CHART_H;
        return (
          <g key={t}>
            <line x1={PAD_L} x2={PAD_L + CHART_W} y1={y} y2={y}
              stroke="rgba(16,25,46,0.07)" strokeWidth={1} strokeDasharray="4 4" />
            <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={10}
              fill="rgba(16,25,46,0.40)" fontFamily="'Work Sans',sans-serif">{fmtVal(t)}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((item, i) => {
        const barH  = max > 0 ? (item.value / max) * CHART_H : 0;
        const cx    = PAD_L + step * i + step / 2;
        const bx    = cx - barW / 2;
        const by    = PAD_T + CHART_H - barH;
        const color = PALETTE[i % PALETTE.length];
        const isHov = hoverIdx === i;

        return (
          <g key={i}
            onMouseEnter={e => onHover(i, cx, by, item.label, item.value, color)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer' }}>
            {/* Shadow */}
            {isHov && (
              <rect x={bx - 2} y={by - 2} width={barW + 4} height={barH + 4}
                rx={6} fill={color} opacity={0.12} />
            )}
            {/* Bar */}
            <rect x={bx} y={by} width={barW} height={Math.max(barH, 2)}
              rx={4}
              fill={isHov ? color : color}
              opacity={hoverIdx === null || isHov ? 1 : 0.45}
              style={{ transition: 'opacity 0.2s, y 0.35s, height 0.35s' }}
            />
            {/* Value label on top when hovered */}
            {isHov && (
              <text x={cx} y={by - 6} textAnchor="middle" fontSize={11}
                fontWeight={700} fill={color}
                fontFamily="'Space Mono',monospace">{fmtVal(item.value)}</text>
            )}
            {/* X label */}
            <text
              x={cx} y={PAD_T + CHART_H + 18}
              textAnchor="middle" fontSize={10}
              fill={isHov ? '#10192E' : 'rgba(16,25,46,0.45)'}
              fontFamily="'Work Sans',sans-serif"
              style={{ transition: 'fill 0.2s' }}>
              {item.label.length > 10 ? item.label.slice(0, 10) + '…' : item.label}
            </text>
          </g>
        );
      })}
    </>
  );
}

/* ──────────────────── LINE / AREA CHART ──────────────────── */
function LineChart({ data, max, ticks, onHover, hoverIdx, area }) {
  const n = data.length;
  // Inner horizontal margin so points never sit on the axis edges
  const INNER_PAD = Math.min(40, CHART_W / (n + 1));
  const usableW   = CHART_W - INNER_PAD * 2;
  // For a single point, center it; otherwise spread evenly
  const pts = data.map((item, i) => ({
    x: PAD_L + INNER_PAD + (n > 1 ? (i / (n - 1)) * usableW : usableW / 2),
    y: PAD_T + CHART_H - (max > 0 ? (item.value / max) * CHART_H : 0),
  }));
  const polyPts   = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaClose = `${pts[pts.length - 1].x},${PAD_T + CHART_H} ${pts[0].x},${PAD_T + CHART_H}`;
  const gradId = 'areaGradLine';
  const rotateLabels = n > 6;

  return (
    <>
      {area && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PALETTE[0]} stopOpacity={0.28} />
            <stop offset="100%" stopColor={PALETTE[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
      )}

      {/* Grid lines */}
      {ticks.map(t => {
        const y = PAD_T + CHART_H - (t / (ticks[ticks.length - 1] || 1)) * CHART_H;
        return (
          <g key={t}>
            <line x1={PAD_L} x2={PAD_L + CHART_W} y1={y} y2={y}
              stroke="rgba(16,25,46,0.07)" strokeWidth={1} strokeDasharray="4 4" />
            <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={10}
              fill="rgba(16,25,46,0.40)" fontFamily="'Work Sans',sans-serif">{fmtVal(t)}</text>
          </g>
        );
      })}

      {/* Area fill */}
      {area && n > 0 && (
        <polygon points={`${polyPts} ${areaClose}`}
          fill={`url(#${gradId})`} />
      )}

      {/* Connecting line */}
      {n > 1 && (
        <polyline points={polyPts} fill="none"
          stroke={PALETTE[0]} strokeWidth={2.5}
          strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* Data points */}
      {pts.map((p, i) => {
        const isHov = hoverIdx === i;
        const labelText = data[i].label;
        return (
          <g key={i}
            onMouseEnter={() => onHover(i, p.x, p.y, data[i].label, data[i].value, PALETTE[0])}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer' }}>
            {/* Hover glow */}
            {isHov && <circle cx={p.x} cy={p.y} r={14} fill={PALETTE[0]} opacity={0.12} />}
            <circle cx={p.x} cy={p.y} r={isHov ? 7 : 4.5}
              fill={isHov ? PALETTE[0] : '#fff'}
              stroke={PALETTE[0]} strokeWidth={2}
              style={{ transition: 'r 0.15s' }} />
            {/* Value on hover */}
            {isHov && (
              <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize={11}
                fontWeight={700} fill={PALETTE[0]}
                fontFamily="'Space Mono',monospace">{fmtVal(data[i].value)}</text>
            )}
            {/* X-axis label — rotated when crowded */}
            {rotateLabels ? (
              <text
                transform={`translate(${p.x}, ${PAD_T + CHART_H + 10}) rotate(-35)`}
                textAnchor="end" fontSize={9}
                fill={isHov ? '#10192E' : 'rgba(16,25,46,0.45)'}
                fontFamily="'Work Sans',sans-serif"
                style={{ transition: 'fill 0.2s' }}>
                {labelText.length > 12 ? labelText.slice(0, 12) + '…' : labelText}
              </text>
            ) : (
              <text x={p.x} y={PAD_T + CHART_H + 18}
                textAnchor="middle" fontSize={10}
                fill={isHov ? '#10192E' : 'rgba(16,25,46,0.45)'}
                fontFamily="'Work Sans',sans-serif"
                style={{ transition: 'fill 0.2s' }}>
                {labelText.length > 11 ? labelText.slice(0, 11) + '…' : labelText}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

/* ──────────────────────── PIE / DONUT CHART ──────────────────────── */
function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx, cy, r, start, end) {
  const s   = polarToCartesian(cx, cy, r, start);
  const e   = polarToCartesian(cx, cy, r, end);
  const big = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${big} 1 ${e.x} ${e.y} Z`;
}

function PieChart({ data, total, onHover, hoverIdx, donut }) {
  const cx = VW / 2, cy = VH / 2 - 10;
  const R  = 95, inner = donut ? 50 : 0;
  let cur  = -90;

  return (
    <>
      {data.map((item, i) => {
        const deg   = (item.value / total) * 360;
        const start = cur;
        cur += deg;
        const end   = cur;
        const mid   = (start + end) / 2;
        const mr    = R + 14;
        const mp    = polarToCartesian(cx, cy, mr, mid);
        const isHov = hoverIdx === i;
        const r     = isHov ? R + 6 : R;

        return (
          <g key={i}
            onMouseEnter={() => onHover(i, mp.x, mp.y - 10, item.label, item.value, PALETTE[i % PALETTE.length])}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
            <path d={slicePath(cx, cy, r, start, end)}
              fill={PALETTE[i % PALETTE.length]}
              opacity={hoverIdx === null || isHov ? 1 : 0.55}
              stroke="#fff" strokeWidth={2}
              style={{ transition: 'opacity 0.2s' }} />
            {donut && (
              <circle cx={cx} cy={cy} r={inner} fill="var(--off-white, #F7F8FA)" />
            )}
          </g>
        );
      })}
      {donut && (
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fontWeight={700}
          fill="#10192E" fontFamily="'Space Mono',monospace">
          {fmtVal(total)}
        </text>
      )}
    </>
  );
}

/* ─────────────────── SCATTER CHART ─────────────────── */
function ScatterChart({ data, max, ticks, onHover, hoverIdx }) {
  const n = data.length;
  // Even slot spacing with inner padding — dots never clip the axis edges
  const INNER_PAD = Math.min(40, CHART_W / (n + 1));
  const usableW   = CHART_W - INNER_PAD * 2;
  const rotateLabels = n > 6;

  return (
    <>
      {/* Grid lines */}
      {ticks.map(t => {
        const y = PAD_T + CHART_H - (t / (ticks[ticks.length - 1] || 1)) * CHART_H;
        return (
          <g key={t}>
            <line x1={PAD_L} x2={PAD_L + CHART_W} y1={y} y2={y}
              stroke="rgba(16,25,46,0.07)" strokeWidth={1} strokeDasharray="4 4" />
            <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={10}
              fill="rgba(16,25,46,0.40)" fontFamily="'Work Sans',sans-serif">{fmtVal(t)}</text>
          </g>
        );
      })}

      {/* Dots */}
      {data.map((item, i) => {
        const x     = PAD_L + INNER_PAD + (n > 1 ? (i / (n - 1)) * usableW : usableW / 2);
        const y     = PAD_T + CHART_H - (max > 0 ? (item.value / max) * CHART_H : 0);
        const color = PALETTE[i % PALETTE.length];
        const isHov = hoverIdx === i;
        return (
          <g key={i}
            onMouseEnter={() => onHover(i, x, y, item.label, item.value, color)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer' }}>
            {/* Glow ring on hover */}
            {isHov && <circle cx={x} cy={y} r={16} fill={color} opacity={0.12} />}
            {/* Dot */}
            <circle cx={x} cy={y} r={isHov ? 9 : 6}
              fill={color}
              opacity={hoverIdx === null || isHov ? 1 : 0.40}
              stroke="#fff" strokeWidth={2}
              style={{ transition: 'r 0.15s, opacity 0.2s' }} />
            {/* Value above dot on hover */}
            {isHov && (
              <text x={x} y={y - 14} textAnchor="middle" fontSize={11}
                fontWeight={700} fill={color}
                fontFamily="'Space Mono',monospace">{fmtVal(item.value)}</text>
            )}
            {/* X-axis label */}
            {rotateLabels ? (
              <text
                transform={`translate(${x}, ${PAD_T + CHART_H + 10}) rotate(-35)`}
                textAnchor="end" fontSize={9}
                fill={isHov ? '#10192E' : 'rgba(16,25,46,0.45)'}
                fontFamily="'Work Sans',sans-serif">
                {item.label.length > 12 ? item.label.slice(0, 12) + '…' : item.label}
              </text>
            ) : (
              <text x={x} y={PAD_T + CHART_H + 18}
                textAnchor="middle" fontSize={10}
                fill={isHov ? '#10192E' : 'rgba(16,25,46,0.45)'}
                fontFamily="'Work Sans',sans-serif">
                {item.label.length > 11 ? item.label.slice(0, 11) + '…' : item.label}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

/* ─────────────────── HORIZONTAL BAR ─────────────────── */
function HBarChart({ data, max, onHover, hoverIdx, padL }) {
  const rowH = Math.min(32, (CHART_H / data.length) * 0.65);
  const step  = CHART_H / data.length;

  return (
    <>
      {data.map((item, i) => {
        const barW  = max > 0 ? (item.value / max) * CHART_W : 0;
        const cy    = PAD_T + step * i + step / 2;
        const color = PALETTE[i % PALETTE.length];
        const isHov = hoverIdx === i;

        return (
          <g key={i}
            onMouseEnter={() => onHover(i, padL + barW * 0.5, cy - rowH, item.label, item.value, color)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer' }}>
            {/* Track */}
            <rect x={padL} y={cy - rowH / 2} width={CHART_W} height={rowH}
              rx={5} fill="rgba(16,25,46,0.04)" />
            {/* Bar */}
            <rect x={padL} y={cy - rowH / 2} width={Math.max(barW, 2)} height={rowH}
              rx={5} fill={color}
              opacity={hoverIdx === null || isHov ? 1 : 0.4}
              style={{ transition: 'opacity 0.2s' }} />
            {/* Highlight ring */}
            {isHov && (
              <rect x={padL} y={cy - rowH / 2} width={Math.max(barW, 2)} height={rowH}
                rx={5} fill="none"
                stroke={color} strokeWidth={2} opacity={0.5} />
            )}
            {/* Full label — no truncation */}
            <text x={padL - 8} y={cy + 4} textAnchor="end" fontSize={11}
              fontWeight={isHov ? 700 : 500}
              fill={isHov ? '#10192E' : 'rgba(16,25,46,0.60)'}
              fontFamily="'Work Sans',sans-serif"
              style={{ transition: 'fill 0.15s, font-weight 0.15s' }}>
              {item.label}
            </text>
            {/* Always-visible value at end of bar */}
            {barW > 30 && (
              <text x={padL + barW - 7} y={cy + 4} textAnchor="end" fontSize={10}
                fontWeight={600} fill="#fff" fontFamily="'Space Mono',monospace"
                opacity={0.9}>
                {fmtVal(item.value)}
              </text>
            )}
            {/* Hover value outside bar */}
            {isHov && (
              <text x={padL + barW + 8} y={cy + 4} textAnchor="start" fontSize={11}
                fontWeight={700} fill={color} fontFamily="'Space Mono',monospace">
                {fmtVal(item.value)}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

/* ─────────────────── LEGEND ─────────────────── */
function Legend({ data, hoverIdx, setHover, pieMode }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem',
      marginTop: '0.75rem', justifyContent: 'center',
    }}>
      {data.map((item, i) => (
        <div key={i}
          onMouseEnter={() => setHover(i, 0, 0, item.label, item.value, PALETTE[i % PALETTE.length])}
          onMouseLeave={() => setHover(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            cursor: 'pointer', opacity: hoverIdx === null || hoverIdx === i ? 1 : 0.4,
            transition: 'opacity 0.2s',
          }}>
          <div style={{
            width: 10, height: 10, borderRadius: pieMode ? '50%' : 3,
            background: PALETTE[i % PALETTE.length], flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────── CHART TYPE TABS ─────────────────── */
const CHART_TYPES = [
  { key: 'bar',   label: 'Bar' },
  { key: 'line',  label: 'Line' },
  { key: 'area',  label: 'Area' },
  { key: 'pie',   label: 'Pie' },
  { key: 'donut', label: 'Donut' },
  { key: 'hbar',  label: 'H‑Bar' },
  { key: 'scatter', label: 'Scatter' },
];

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
export default function AutoChart({ config }) {
  const [hoverState, setHoverState] = useState(null); // { idx, x, y, label, value, color }
  const [activeType, setActiveType] = useState(null);  // null → use config.type

  if (!config || !config.labels || !config.values || config.labels.length === 0) {
    return (
      <div style={{
        borderRadius: '14px', padding: '1.5rem', background: 'var(--surface, #fff)',
        border: '1px solid var(--border, #e2e8f0)',
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        color: 'var(--text-muted, #9AA5C9)', fontSize: '0.88rem',
      }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-4"/>
        </svg>
        No chart data available.
      </div>
    );
  }

  const configType = (config.type || 'bar').toLowerCase();
  const chartType  = activeType ?? (configType === 'table' ? 'bar' : configType);
  const title      = config.title || 'Chart';
  const labels     = config.labels || [];
  const values     = config.values || [];

  const data  = labels.map((label, i) => ({ label: String(label), value: Number(values[i]) || 0 }));
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const max   = Math.max(...data.map(d => d.value)) || 1;
  const ticks = niceTicks(max);
  const tickMax = ticks[ticks.length - 1] || max;

  const isPie    = chartType === 'pie' || chartType === 'donut';
  const hoverIdx = hoverState?.idx ?? null;

  /* Dynamic left padding for H-Bar: estimate 7px per char + 16px margin, clamp 60–200 */
  const maxLabelLen = data.reduce((m, d) => Math.max(m, d.label.length), 0);
  const dynPadL = chartType === 'hbar'
    ? Math.min(Math.max(maxLabelLen * 7 + 16, 60), 200)
    : PAD_L;
  const dynVW = dynPadL + CHART_W + PAD_R;

  function handleHover(idx, x, y, label, value, color) {
    if (idx === null) setHoverState(null);
    else setHoverState({ idx, x, y, label, value, color });
  }

  /* Axes for non-pie charts — use dynPadL so H-Bar axis aligns with wider labels */
  const axes = !isPie && (
    <>
      {/* Y axis */}
      <line x1={dynPadL} x2={dynPadL} y1={PAD_T} y2={PAD_T + CHART_H}
        stroke="rgba(16,25,46,0.15)" strokeWidth={1} />
      {/* X axis */}
      <line x1={dynPadL} x2={dynPadL + CHART_W} y1={PAD_T + CHART_H} y2={PAD_T + CHART_H}
        stroke="rgba(16,25,46,0.15)" strokeWidth={1} />
    </>
  );

  return (
    <div style={{
      borderRadius: '16px',
      border: '1px solid var(--border, #e8ecf5)',
      background: 'var(--surface, #fff)',
      padding: '1.25rem 1.25rem 1rem',
      boxShadow: '0 2px 12px rgba(16,25,46,0.06)',
    }}>
      {/* Header row: title + meta */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #10192E)', marginBottom: '0.15rem', fontFamily: "'Space Mono',monospace" }}>
          {title}
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #9AA5C9)', fontWeight: 500 }}>
          {data.length} data point{data.length !== 1 ? 's' : ''} · total {fmtVal(total)}
        </span>
      </div>

      {/* Chart type switcher — full-width own row, scroll if needed */}
      <div style={{
        display: 'flex', gap: '0.3rem', marginBottom: '1rem',
        overflowX: 'auto', paddingBottom: '2px',
        /* hide scrollbar but keep scrollability */
        scrollbarWidth: 'none',
      }}>
        {CHART_TYPES.map(({ key, label }) => {
          const isActive = chartType === key;
          return (
            <button key={key} onClick={() => { setActiveType(key); setHoverState(null); }}
              style={{
                padding: '0.28rem 0.7rem', borderRadius: '6px', fontSize: '0.72rem',
                fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                fontFamily: "'Work Sans',sans-serif",
                whiteSpace: 'nowrap', flexShrink: 0,
                background: isActive ? 'var(--royal-blue, #3457D5)' : 'transparent',
                borderColor: isActive ? 'var(--royal-blue, #3457D5)' : 'rgba(16,25,46,0.12)',
                color: isActive ? '#fff' : 'var(--text-muted, #9AA5C9)',
                transition: 'all 0.15s',
              }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* SVG Chart — always full card width, viewBox widens for H-Bar labels */}
      <div style={{ position: 'relative', userSelect: 'none', width: '100%' }}>
        <svg viewBox={`0 0 ${dynVW} ${VH}`} width="100%" style={{ overflow: 'visible', display: 'block', minWidth: 0 }}>
          {axes}

          {(chartType === 'bar') && (
            <BarChart data={data} max={tickMax} ticks={ticks}
              onHover={handleHover} hoverIdx={hoverIdx} />
          )}
          {(chartType === 'line') && (
            <LineChart data={data} max={tickMax} ticks={ticks}
              onHover={handleHover} hoverIdx={hoverIdx} area={false} />
          )}
          {(chartType === 'area') && (
            <LineChart data={data} max={tickMax} ticks={ticks}
              onHover={handleHover} hoverIdx={hoverIdx} area={true} />
          )}
          {(chartType === 'scatter') && (
            <ScatterChart data={data} max={tickMax} ticks={ticks}
              onHover={handleHover} hoverIdx={hoverIdx} />
          )}
          {(chartType === 'hbar') && (
            <HBarChart data={data} max={max}
              onHover={handleHover} hoverIdx={hoverIdx} padL={dynPadL} />
          )}
          {(chartType === 'pie' || chartType === 'donut') && (
            <PieChart data={data} total={total}
              onHover={handleHover} hoverIdx={hoverIdx}
              donut={chartType === 'donut'} />
          )}

          {/* Tooltip */}
          {hoverState && hoverState.x > 0 && (
            <Tooltip
              x={hoverState.x} y={hoverState.y}
              label={hoverState.label} value={hoverState.value}
              color={hoverState.color} />
          )}
        </svg>
      </div>

      {/* Legend */}
      <Legend data={data} hoverIdx={hoverIdx} setHover={handleHover}
        pieMode={isPie} />
    </div>
  );
}
