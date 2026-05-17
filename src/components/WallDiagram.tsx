import React, { useMemo, useRef, useCallback, useState } from 'react';
import type { AccuracyStepMm, WallConfig, ItemDef, LayoutResult, UnitSystem } from '../lib/types';
import { formatLengthWithAccuracy } from '../lib/units';

const COLOURS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6',
];

type SvgC = {
  svgBg: string;
  wallFill: string;
  wallStroke: string;
  centreLine: string;
  centreAccent: string;
  textPrimary: string;
  textMuted: string;
  connector: string;
};

const DARK_SVG: SvgC = {
  svgBg: '#121a30',
  wallFill: '#15213e',
  wallStroke: '#2a3e77',
  centreLine: 'rgba(0,209,255,0.45)',
  centreAccent: '#00d1ff',
  textPrimary: '#f3f7ff',
  textMuted: '#a9b8df',
  connector: 'rgba(169,184,223,0.5)',
};

const LIGHT_SVG: SvgC = {
  svgBg: '#eef2ff',
  wallFill: '#dce6ff',
  wallStroke: '#b8c8ee',
  centreLine: 'rgba(0,140,185,0.35)',
  centreAccent: '#007fa8',
  textPrimary: '#0d1730',
  textMuted: '#5a6e9a',
  connector: 'rgba(90,110,154,0.55)',
};

const PAD = 28;
const HOLE_LABEL_LANE_STEP = 13;

const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

interface Props {
  wall: WallConfig;
  items: ItemDef[];
  layout: LayoutResult;
  svgWidth: number;
  theme: 'dark' | 'light';
  unitSystem: UnitSystem;
  accuracyStepMm: AccuracyStepMm;
}

export const WallDiagram: React.FC<Props> = ({ wall, items, layout, svgWidth, theme, unitSystem, accuracyStepMm }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [showHoleLabels, setShowHoleLabels] = useState(true);
  const C = theme === 'dark' ? DARK_SVG : LIGHT_SVG;

  const drawW = Math.max(100, svgWidth - PAD * 2);
  const scale = drawW / Math.max(1, wall.width);
  const drawH = wall.height * scale;
  const diagramH = drawH + PAD * 2;
  const toX = (cm: number) => PAD + cm * scale;
  const toY = (cm: number) => PAD + cm * scale;
  const cx = toX(wall.width / 2);
  const cy = toY(wall.height / 2);

  const colourMap = useMemo(
    () => Object.fromEntries(items.map((item, i) => [item.id, COLOURS[i % COLOURS.length]])),
    [items],
  );

  const holesByItem = useMemo(() => {
    const map: Record<string, Array<{
      x: number;
      y: number;
      fromLeft: number;
      fromRight: number;
      fromTop: number;
      fromBottom: number;
      holeIndex: number;
    }>> = {};
    for (const h of layout.holes) {
      if (!map[h.itemId]) map[h.itemId] = [];
      map[h.itemId].push({
        x: h.fromLeft,
        y: h.fromTop,
        fromLeft: h.fromLeft,
        fromRight: h.fromRight,
        fromTop: h.fromTop,
        fromBottom: h.fromBottom,
        holeIndex: h.holeIndex,
      });
    }
    return map;
  }, [layout.holes]);

  const positionById = useMemo(
    () => Object.fromEntries(layout.itemPositions.map((p) => [p.itemId, p])),
    [layout.itemPositions],
  );

  const downloadPng = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const str = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const px = 2;
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth * px;
      canvas.height = diagramH * px;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }

      ctx.scale(px, px);
      ctx.fillStyle = C.svgBg;
      ctx.fillRect(0, 0, svgWidth, diagramH);
      ctx.drawImage(img, 0, 0, svgWidth, diagramH);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const a = document.createElement('a');
        const dlUrl = URL.createObjectURL(pngBlob);
        a.href = dlUrl;
        a.download = 'wall-plan.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(dlUrl);
      }, 'image/png');
    };

    img.src = url;
  }, [C.svgBg, diagramH, svgWidth]);

  return (
    <div className="wp-panel">
      <div className="flex items-center justify-between mb-3">
        <h2 className="wp-heading" style={{ margin: 0 }}>Wall diagram</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHoleLabels((v) => !v)}
            className="wp-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {showHoleLabels ? 'Hide hole labels' : 'Show hole labels'}
          </button>
          <button onClick={downloadPng} className="wp-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Save PNG
          </button>
        </div>
      </div>

      {layout.overflow && (
        <p className="text-sm rounded-lg px-3 py-2 mb-3" style={{ color: 'var(--lt-red)', background: 'rgba(255,59,63,0.1)', border: '1px solid rgba(255,59,63,0.3)' }}>
          Items overflow the wall bounds. Adjust dimensions or layout settings.
        </p>
      )}

      <svg
        ref={svgRef}
        width={svgWidth}
        height={diagramH}
        viewBox={`0 0 ${svgWidth} ${diagramH}`}
        className="w-full"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        <rect width={svgWidth} height={diagramH} fill={C.svgBg} />

        <rect x={PAD} y={PAD} width={drawW} height={drawH} rx={4} fill={C.wallFill} stroke={C.wallStroke} strokeWidth={2} />

        <line x1={cx} x2={cx} y1={PAD} y2={PAD + drawH} stroke={C.centreLine} strokeWidth={1} strokeDasharray="4 3" />
        <line x1={PAD} x2={PAD + drawW} y1={cy} y2={cy} stroke={C.centreLine} strokeWidth={1} strokeDasharray="4 3" />
        <text x={cx} y={PAD - 8} textAnchor="middle" fontSize={10} fill={C.centreAccent}>wall center</text>

        {(layout.connectors ?? []).map((link, idx) => {
          const from = positionById[link.fromItemId];
          const to = positionById[link.toItemId];
          const fromItem = items.find((i) => i.id === link.fromItemId);
          const toItem = items.find((i) => i.id === link.toItemId);
          if (!from || !to || !fromItem || !toItem) return null;

          return (
            <line
              key={idx}
              x1={toX(from.x + fromItem.width / 2)}
              y1={toY(from.y + fromItem.height / 2)}
              x2={toX(to.x + toItem.width / 2)}
              y2={toY(to.y + toItem.height / 2)}
              stroke={C.connector}
              strokeWidth={1.5}
              strokeDasharray="3 2"
            />
          );
        })}

        {/* Ghosted item layer */}
        {items.map((item, i) => {
          const pos = layout.itemPositions[i];
          if (!pos) return null;

          const x = toX(pos.x);
          const y = toY(pos.y);
          const w = item.width * scale;
          const h = item.height * scale;
          const col = colourMap[item.id];

          return (
            <g key={`${item.id}-body`}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={3}
                fill={col}
                fillOpacity={0.1}
                stroke={col}
                strokeOpacity={0.75}
                strokeWidth={1.2}
              />

              {w > 24 && h > 14 && (
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(11, Math.max(7, w / Math.max(item.name.length, 1)))}
                  fill={col}
                  fontWeight={600}
                  opacity={0.92}
                >
                  {item.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Hole layer always on top for legibility */}
        {items.map((item, i) => {
          const pos = layout.itemPositions[i];
          if (!pos) return null;

          const x = toX(pos.x);
          const y = toY(pos.y);
          const w = item.width * scale;
          const h = item.height * scale;
          const holes = holesByItem[item.id] ?? [];

          return (
            <g key={`${item.id}-holes`}>
              {holes.map((hPos, hi) => {
                const hx = toX(hPos.x);
                const hy = toY(hPos.y);
                const hasMultipleHoles = holes.length > 1;
                const topValue = formatLengthWithAccuracy(hPos.fromTop, unitSystem, accuracyStepMm);
                const bottomValue = formatLengthWithAccuracy(hPos.fromBottom, unitSystem, accuracyStepMm);
                const leftValue = formatLengthWithAccuracy(hPos.fromLeft, unitSystem, accuracyStepMm);
                const rightValue = formatLengthWithAccuracy(hPos.fromRight, unitSystem, accuracyStepMm);
                const holeTag = `${hPos.holeIndex + 1}`;
                const holePrefix = hasMultipleHoles ? `${holeTag}: ` : '';

                // Keep labels compact and lane-staggered per hole to avoid collisions.
                const sideDir = hi % 2 === 0 ? -1 : 1;
                const laneIndex = Math.floor(hi / 2);
                const baseLabelX = hx + sideDir * 28;
                const baseLabelY = hy - 20 - laneIndex * HOLE_LABEL_LANE_STEP;
                const labelX = clamp(baseLabelX, x + 10, x + w - 10);
                const labelY = clamp(baseLabelY, y + 12, y + h - 20);
                const labelAnchor = sideDir < 0 ? 'end' : 'start';
                const line1 = `${holePrefix}L ${leftValue}  R ${rightValue}`;
                const line2 = `T ${topValue}  B ${bottomValue}`;

                return (
                  <g key={hi}>
                    <circle cx={hx} cy={hy} r={4.2} fill={C.svgBg} stroke={C.centreAccent} strokeWidth={1.2} />
                    <line x1={hx - 3} x2={hx + 3} y1={hy} y2={hy} stroke={C.centreAccent} strokeWidth={1} />
                    <line x1={hx} x2={hx} y1={hy - 3} y2={hy + 3} stroke={C.centreAccent} strokeWidth={1} />
                    {showHoleLabels && w > 90 && h > 48 && (
                      <g>
                        <line x1={hx} y1={hy} x2={labelX} y2={labelY - 6} stroke={C.centreLine} strokeWidth={0.9} />
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor={labelAnchor}
                          fontSize={7.5}
                          fill={C.textPrimary}
                          fontWeight={700}
                          style={{ paintOrder: 'stroke', stroke: C.svgBg, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}
                        >
                          {line1}
                        </text>
                        <text
                          x={labelX}
                          y={labelY + 10}
                          textAnchor={labelAnchor}
                          fontSize={7.5}
                          fill={C.textPrimary}
                          fontWeight={700}
                          style={{ paintOrder: 'stroke', stroke: C.svgBg, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}
                        >
                          {line2}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      <p className="text-xs mt-2" style={{ color: 'var(--lt-subtle)' }}>
        Measurements include left/right and top/bottom distances for each hole.
      </p>
      <p className="text-xs" style={{ color: 'var(--lt-subtle)' }}>
        Circular, hub-spoke, and splat modes are available from the layout panel.
      </p>
    </div>
  );
};
