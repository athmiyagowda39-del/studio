'use client';

import { useState, useEffect, useRef } from 'react';

type Stage = { name: string; value: number };

type ConversionFunnelChartProps = {
  data: Stage[];
  onStageClick?: (stageName: string) => void;
};

const STAGE_COLORS = [
  { from: '#FF6B35', to: '#FF4500', glow: '#FF6B35' },
  { from: '#181ecf', to: '#321682', glow: '#2a1b9f' },
  { from: '#06B6D4', to: '#0891B2', glow: '#06B6D4' },
  { from: '#22d79b', to: '#059669', glow: '#10B981' },
  { from: '#8B5CF6', to: '#7C3AED', glow: '#8B5CF6' },
  { from: '#EC4899', to: '#DB2777', glow: '#EC4899' },
];

function useAnimatedValue(target: number, delay: number = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start: number | null = null;
      const duration = 900;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return val;
}

function AnimatedNumber({ value, delay }: { value: number; delay: number }) {
  const v = useAnimatedValue(value, delay);
  return <>{v.toLocaleString()}</>;
}

export default function ConversionFunnelChart({ data, onStageClick }: ConversionFunnelChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!data || data.length === 0) return null;

  const max = data[0].value;

  // Funnel geometry
  const FUNNEL_W = 560;
  const FUNNEL_H = 480;
  const topW = FUNNEL_W * 0.92;
  const bottomW = FUNNEL_W * 0.06;
  const gapH = 4;
  const stageH = (FUNNEL_H - gapH * (data.length - 1)) / data.length;
  const cx = FUNNEL_W / 2;

  const stages = data.map((d, i) => {
    const ratio = d.value / max;
    const nextRatio = data[i + 1] ? data[i + 1].value / max : 0;
    const minW = bottomW;

    const wTop = minW + (topW - minW) * ratio;
    const wBot = i < data.length - 1 ? minW + (topW - minW) * nextRatio : minW;

    const y = i * (stageH + gapH);
    const x1 = cx - wTop / 2;
    const x2 = cx + wTop / 2;
    const x3 = cx + wBot / 2;
    const x4 = cx - wBot / 2;

    const color = STAGE_COLORS[i % STAGE_COLORS.length];
    const convPct = i === 0 ? 100 : Math.round((d.value / max) * 100);
    const dropPct = i === 0 ? 0 : Math.round(((data[i - 1].value - d.value) / max) * 100);

    return { ...d, y, stageH, x1, x2, x3, x4, color, convPct, dropPct, index: i };
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600&display=swap');

        .cfr-root {
          font-family: 'Outfit', sans-serif;
          width: 100%;
          border-radius: 24px;
          padding: 36px 28px 32px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }
        .cfr-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 40% at 20% -10%, rgba(255,107,53,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 110%, rgba(139,92,246,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(6,182,212,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .cfr-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 28px;
          position: relative;
          z-index: 1;
        }
        .cfr-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(18px, 3vw, 26px);
          font-weight: 800;
          color: #000000;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }
        .cfr-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          color: #475569;
          text-transform: uppercase;
          margin: 0 0 4px;
        }
        .cfr-sub {
          font-size: 13px;
          color: #475569;
          margin: 0;
        }
        .cfr-sub span { font-weight: 600; color: #FF6B35; }
        .cfr-badge {
          background: rgba(28, 62, 34, 0.12);
          border: 1px solid rgba(22, 214, 138, 0.25);
          border-radius: 12px;
          padding: 8px 16px;
          text-align: center;
        }
        .cfr-badge-num {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #10B981;
          line-height: 1;
        }
        .cfr-badge-lbl {
          font-family: 'Syne', sans-serif;
          font-size: 8px;
          font-weight: 800;
          color: #10B981;
          opacity: 0.65;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 2px;
        }
        .cfr-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
          position: relative;
          z-index: 1;
        }
        @media (min-width: 680px) {
          .cfr-grid {
            grid-template-columns: 1fr auto;
            gap: 28px;
            align-items: center;
          }
        }
        .cfr-svg-wrap {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .cfr-svg-wrap svg {
          width: 100%;
          max-width: 520px;
          height: auto;
          overflow: visible;
        }
        .cfr-stage-group {
          cursor: pointer;
        }
        .cfr-stage-group polygon.main {
          transition: opacity 0.2s, filter 0.2s;
        }
        .cfr-stage-group:hover polygon.main {
          opacity: 1 !important;
          filter: brightness(1.18) saturate(1.15);
        }
        .cfr-cards {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-width: 190px;
          max-width: 250px;
          width: 100%;
        }
        @media (max-width: 679px) {
          .cfr-cards {
            max-width: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          }
        }
        .cfr-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 10px 13px;
          cursor: pointer;
          transition: all 0.18s ease;
          position: relative;
          overflow: hidden;
        }
        .cfr-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          border-radius: 2px 0 0 2px;
          background: var(--cc);
          box-shadow: 0 0 8px var(--cc);
        }
        .cfr-card:hover, .cfr-card.active {
          background: rgba(255,255,255,0.065);
          border-color: rgba(255,255,255,0.12);
          transform: translateX(4px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.28);
        }
        .cfr-card-name {
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cfr-card-val {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 5px;
        }
        .cfr-bar-bg {
          height: 3px;
          background: rgba(255,255,255,0.07);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 5px;
        }
        .cfr-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 1.1s cubic-bezier(0.16,1,0.3,1);
        }
        .cfr-pcts { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .cfr-pct {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 5px;
          line-height: 1.4;
        }
      `}</style>

      <div className="cfr-root">
        {/* Header */}
        <div className="cfr-header">
          <div>
            <p className="cfr-label">Sales Pipeline</p>
            <h2 className="cfr-title">Conversion Funnel</h2>
            <p className="cfr-sub">
              <span>{data[0]?.value.toLocaleString()}</span> total leads · {data.length} stages
            </p>
          </div>
          <div className="cfr-badge">
            <div className="cfr-badge-num">
              {mounted
                ? <AnimatedNumber value={data[data.length - 2]?.value} delay={600} />
                : data[data.length - 1]?.value}
            </div>
            <div className="cfr-badge-lbl">Purchase</div>
          </div>
        </div>

        {/* Main grid */}
        <div className="cfr-grid">
          {/* SVG Funnel */}
          <div className="cfr-svg-wrap">
            <svg viewBox={`0 0 ${FUNNEL_W} ${FUNNEL_H + 10}`} xmlns="http://www.w3.org/2000/svg">
              <defs>
                {stages.map((s, i) => (
                  <linearGradient key={`g${i}`} id={`cfg${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={s.color.from} stopOpacity="1" />
                    <stop offset="100%" stopColor={s.color.to} stopOpacity="0.85" />
                  </linearGradient>
                ))}
                {stages.map((s, i) => (
                  <filter key={`fl${i}`} id={`cfg-fl${i}`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>

              {stages.map((s, i) => {
                const isH = hovered === i;
                const pts = `${s.x1},${s.y} ${s.x2},${s.y} ${s.x3},${s.y + s.stageH} ${s.x4},${s.y + s.stageH}`;
                const availW = (s.x2 - s.x1 + s.x3 - s.x4) / 2;
                const labelCx = cx;
                const labelCy = s.y + s.stageH / 2;
                const fontSize = Math.max(11, Math.min(19, availW / 4.5));

                return (
                  <g
                    key={`s${i}`}
                    className="cfr-stage-group"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => onStageClick?.(s.name)}
                    style={{ transform: isH ? 'translateY(-2px)' : 'translateY(0)', transition: 'transform 0.2s' }}
                  >
                    {/* Glow bg */}
                    {isH && (
                      <polygon
                        points={pts}
                        fill={s.color.from}
                        opacity="0.22"
                        filter={`url(#cfg-fl${i})`}
                      />
                    )}
                    {/* Main shape */}
                    <polygon
                      className="main"
                      points={pts}
                      fill={`url(#cfg${i})`}
                      opacity={isH ? 1 : 0.88}
                    />
                    {/* Shine */}
                    <polygon
                      points={`${s.x1},${s.y} ${cx},${s.y} ${cx},${s.y + s.stageH * 0.45} ${s.x4},${s.y + s.stageH}`}
                      fill="white"
                      opacity="0.04"
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Top edge */}
                    <line x1={s.x1} y1={s.y} x2={s.x2} y2={s.y} stroke="white" strokeWidth="1.5" opacity="0.18" />

                    {/* Center label */}
                    {s.stageH > 24 && (
                      <>
                        <text
                          x={labelCx}
                          y={labelCy - (availW > 110 ? 8 : 0)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={fontSize}
                          fontWeight="700"
                          fontFamily="'Syne', sans-serif"
                          opacity="0.95"
                        >
                          {mounted ? s.value.toLocaleString() : ''}
                        </text>
                        {availW > 110 && (
                          <text
                            x={labelCx}
                            y={labelCy + fontSize * 0.75}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize={Math.max(9, fontSize - 5)}
                            fontFamily="'Outfit', sans-serif"
                            opacity="0.55"
                          >
                            {s.name}
                          </text>
                        )}
                      </>
                    )}

                    {/* Conversion % badge */}
                    {/* {i > 0 && (
                      <>
                        <rect
                          x={s.x2 + 6}
                          y={s.y + s.stageH / 2 - 11}
                          width={46}
                          height={22}
                          rx={6}
                          fill={s.color.from}
                          opacity="0.15"
                        />
                        <text
                          x={s.x2 + 29}
                          y={s.y + s.stageH / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={s.color.from}
                          fontSize="11"
                          fontWeight="700"
                          fontFamily="'Outfit', sans-serif"
                        >
                          {s.convPct}%
                        </text>
                      </>
                    )} */}

                    {/* Drop % between stages */}
                    {/* {i > 0 && s.dropPct > 0 && (() => {
                      const prev = stages[i - 1];
                      const midY = prev.y + prev.stageH + gapH / 2;
                      return (
                        <text
                          x={s.x4 - 8}
                          y={midY + 1}
                          textAnchor="end"
                          dominantBaseline="middle"
                          fill="#EF4444"
                          fontSize="10"
                          fontWeight="600"
                          fontFamily="'Outfit', sans-serif"
                          opacity="0.65"
                        >
                          −{s.dropPct}%
                        </text>
                      );
                    })()} */}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Stage cards */}
          <div className="cfr-cards">
            {stages.map((s, i) => (
              <div
                key={s.name}
                className={`cfr-card${hovered === i ? ' active' : ''}`}
                style={{ '--cc': s.color.from } as React.CSSProperties}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onStageClick?.(s.name)}
              >
                <div className="cfr-card-name">{s.name}</div>
                <div className="cfr-card-val" style={{ color: s.color.from }}>
                  {mounted ? <AnimatedNumber value={s.value} delay={i * 120} /> : s.value.toLocaleString()}
                </div>
                {/* <div className="cfr-bar-bg">
                  <div
                    className="cfr-bar"
                    style={{
                      width: mounted ? `${s.convPct}%` : '0%',
                      background: `linear-gradient(90deg, ${s.color.to}, ${s.color.from})`,
                      boxShadow: `0 0 6px ${s.color.glow}55`,
                    }}
                  />
                </div>
                <div className="cfr-pcts">
                  {i === 0 && (
                    <span className="cfr-pct" style={{ background: `${s.color.from}22`, color: s.color.from }}>
                      Total
                    </span>
                  )}
                </div> */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}