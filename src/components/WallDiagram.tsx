import React, { useMemo, useRef, useCallback } from 'react';
import type { WallConfig, ItemDef, LayoutResult } from '../lib/types';
import { round1 } from '../lib/calculations';

const COLOURS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6',
];

type SvgC = {
  svgBg: string; wallFill: string; wallStroke: string; dimLine: string;
  arrowColor: string; centreLine: string; centreAccent: string; holeGuide: string;
  textPrimary: string; textMuted: string; rulerBase: string; segMargin: string; segGutter: string;
};
const DARK_SVG: SvgC = {
  svgBg: '#121a30', wallFill: '#15213e', wallStroke: '#2a3e77', dimLine: '#2a3e77',
  arrowColor: '#a9b8df', centreLine: 'rgba(0,209,255,0.45)', centreAccent: '#00d1ff',
  holeGuide: 'rgba(0,209,255,0.3)', textPrimary: '#f3f7ff', textMuted: '#a9b8df',
  rulerBase: '#2a3e77', segMargin: '#4a6090', segGutter: '#3d5580',
};
const LIGHT_SVG: SvgC = {
  svgBg: '#eef2ff', wallFill: '#dce6ff', wallStroke: '#b8c8ee', dimLine: '#c8d4f0',
  arrowColor: '#6a85b8', centreLine: 'rgba(0,140,185,0.35)', centreAccent: '#007fa8',
  holeGuide: 'rgba(0,140,185,0.2)', textPrimary: '#0d1730', textMuted: '#5a6e9a',
  rulerBase: '#b8c8ee', segMargin: '#8a9fc0', segGutter: '#aabcd8',
};

// ── Layout constants (px) ────────────────────────────────────────────────────
const PAD = 28;            // left/right SVG padding
const WALL_TOP = 52;       // top of wall band
const WALL_H = 60;         // height of wall band
const WALL_BOTTOM = WALL_TOP + WALL_H;   // 112
const WALL_MID = WALL_TOP + WALL_H / 2; // 82

// Above wall
const DIM_LINE_Y  = WALL_TOP - 20; // 32 – wall-span arrow line
const DIM_TEXT_Y  = WALL_TOP - 26; // 26 – "200 cm total" label

// Below wall
const FROM_R_Y    = WALL_BOTTOM + 16; // 128 – fromRight labels
const RULER_Y     = WALL_BOTTOM + 42; // 154 – segment ruler line
const RULER_LBL_Y = RULER_Y + 14;    // 168 – ruler segment labels
const DIAGRAM_H   = RULER_LBL_Y + 22; // 190

interface Hole { fromLeft: number; fromRight: number }
type Segment = { start: number; end: number; label: string; colour: string };

interface Props {
  wall: WallConfig;
  items: ItemDef[];
  layout: LayoutResult;
  svgWidth: number;
  theme: 'dark' | 'light';
}

export const WallDiagram: React.FC<Props> = ({ wall, items, layout, svgWidth, theme }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const C = theme === 'dark' ? DARK_SVG : LIGHT_SVG;

  const drawW  = svgWidth - PAD * 2;
  const scale  = drawW / wall.width;
  const toX    = (cm: number) => PAD + cm * scale;
  const cx     = toX(wall.width / 2);

  const colourMap = useMemo(
    () => Object.fromEntries(items.map((item, i) => [item.id, COLOURS[i % COLOURS.length]])),
    [items],
  );

  // Group holes (fromLeft + fromRight) by item id
  const holesByItem = useMemo(() => {
    const map: Record<string, Hole[]> = {};
    for (const h of layout.holes) {
      if (!map[h.itemId]) map[h.itemId] = [];
      map[h.itemId].push({ fromLeft: h.fromLeft, fromRight: h.fromRight });
    }
    return map;
  }, [layout.holes]);

  // Segments for the bottom ruler: left margin | items + gutters | right margin
  const segments = useMemo<Segment[]>(() => {
    if (!items.length) return [];
    const c = theme === 'dark' ? DARK_SVG : LIGHT_SVG;
    const segs: Segment[] = [];

    const firstStart = layout.itemStartPositions[0];
    if (firstStart > 0.05) {
      segs.push({ start: 0, end: firstStart, label: `${round1(firstStart)} cm`, colour: c.segMargin });
    }

    items.forEach((item, i) => {
      const s = layout.itemStartPositions[i];
      segs.push({ start: s, end: s + item.width, label: `${item.width} cm`, colour: colourMap[item.id] });

      if (i < items.length - 1) {
        const gap = layout.itemStartPositions[i + 1] - (s + item.width);
        if (gap > 0.05) {
          segs.push({
            start: s + item.width,
            end: layout.itemStartPositions[i + 1],
            label: `${round1(gap)} cm`,
            colour: c.segGutter,
          });
        }
      }
    });

    const lastEnd = layout.itemStartPositions[items.length - 1] + items[items.length - 1].width;
    const rightM  = wall.width - lastEnd;
    if (rightM > 0.05) {
      segs.push({ start: lastEnd, end: wall.width, label: `${round1(rightM)} cm`, colour: c.segMargin });
    }
    return segs;
  }, [items, layout, wall.width, colourMap, theme]);

  // ── PNG download ────────────────────────────────────────────────────────────
  const downloadPng = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const str  = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();

    img.onload = () => {
      const px     = 2; // 2× for retina sharpness
      const canvas = document.createElement('canvas');
      canvas.width  = svgWidth * px;
      canvas.height = DIAGRAM_H * px;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(px, px);
      ctx.fillStyle = C.svgBg;
      ctx.fillRect(0, 0, svgWidth, DIAGRAM_H);
      ctx.drawImage(img, 0, 0, svgWidth, DIAGRAM_H);
      URL.revokeObjectURL(url);

      canvas.toBlob(pngBlob => {
        if (!pngBlob) return;
        const a     = document.createElement('a');
        const dlUrl = URL.createObjectURL(pngBlob);
        a.href     = dlUrl;
        a.download = 'wall-plan.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(dlUrl);
      }, 'image/png');
    };
    img.src = url;
  }, [svgWidth, theme]);

  return (
    <div className="wp-panel">
      <div className="flex items-center justify-between mb-3">
        <h2 className="wp-heading" style={{ margin: 0 }}>Wall diagram</h2>
        <button onClick={downloadPng} className="wp-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ⬇ Save PNG
        </button>
      </div>

      {layout.overflow && (
        <p className="text-sm rounded-lg px-3 py-2 mb-3" style={{ color: 'var(--lt-red)', background: 'rgba(255,59,63,0.1)', border: '1px solid rgba(255,59,63,0.3)' }}>
          ⚠ Items overflow the wall width — check your measurements.
        </p>
      )}

      <svg
        ref={svgRef}
        width={svgWidth}
        height={DIAGRAM_H}
        viewBox={`0 0 ${svgWidth} ${DIAGRAM_H}`}
        className="w-full"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {/* Background fill */}
        <rect width={svgWidth} height={DIAGRAM_H} fill={C.svgBg} />

        <defs>
          {/* Arrowheads for the wall-span dimension line */}
          <marker id="dimArrowL" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M6,0 L0,3 L6,6" fill="none" stroke={C.arrowColor} strokeWidth="1.2" />
          </marker>
          <marker id="dimArrowR" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="none" stroke={C.arrowColor} strokeWidth="1.2" />
          </marker>
        </defs>

        {/* ── Wall-span dimension (above wall) ── */}
        {/* Vertical witness lines at each wall edge */}
        <line x1={PAD}        x2={PAD}        y1={DIM_TEXT_Y - 2} y2={WALL_TOP} stroke={C.dimLine} strokeWidth={1} />
        <line x1={PAD + drawW} x2={PAD + drawW} y1={DIM_TEXT_Y - 2} y2={WALL_TOP} stroke={C.dimLine} strokeWidth={1} />
        {/* Horizontal arrow */}
        <line
          x1={PAD} x2={PAD + drawW} y1={DIM_LINE_Y} y2={DIM_LINE_Y}
          stroke={C.arrowColor} strokeWidth={1}
          markerStart="url(#dimArrowL)" markerEnd="url(#dimArrowR)"
        />
        <text x={PAD + drawW / 2} y={DIM_TEXT_Y} textAnchor="middle" fontSize={11} fill={C.arrowColor}>
          {wall.width} cm total
        </text>

        {/* ── Wall outline ── */}
        <rect x={PAD} y={WALL_TOP} width={drawW} height={WALL_H} rx={4} fill={C.wallFill} stroke={C.wallStroke} strokeWidth={2} />

        {/* ── Centre dashed line ── */}
        <line x1={cx} x2={cx} y1={WALL_TOP} y2={WALL_BOTTOM} stroke={C.centreLine} strokeWidth={1} strokeDasharray="4 3" />
        <text x={cx} y={WALL_BOTTOM + 10} textAnchor="middle" fontSize={9} fill={C.centreAccent}>↑ centre</text>

        {/* ── Items + holes ── */}
        {items.map((item, i) => {
          const startX = layout.itemStartPositions[i];
          const x      = toX(startX);
          const w      = item.width * scale;
          const col    = colourMap[item.id];
          const holes  = holesByItem[item.id] ?? [];

          return (
            <g key={item.id}>
              {/* Item rectangle */}
              <rect x={x} y={WALL_TOP + 6} width={w} height={WALL_H - 12} rx={3}
                fill={col} fillOpacity={0.18} stroke={col} strokeWidth={1.5} />

              {/* Item name (omit if too narrow) */}
              {w > 18 && (
                <text
                  x={x + w / 2} y={WALL_MID}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.min(11, Math.max(7, w / Math.max(item.name.length, 1) * 1.1))}
                  fill={col} fontWeight={600}
                >
                  {item.name}
                </text>
              )}

              {/* Holes */}
              {holes.map((h, hi) => {
                const hpx = toX(h.fromLeft);
                return (
                  <g key={hi}>
                    {/* Dashed guide vertical */}
                    <line x1={hpx} x2={hpx} y1={WALL_TOP + 6} y2={WALL_BOTTOM - 6}
                      stroke={C.holeGuide} strokeWidth={1} strokeDasharray="2 2" />
                    {/* Crosshair */}
                    <circle cx={hpx} cy={WALL_MID} r={5} fill={C.svgBg} stroke={C.centreAccent} strokeWidth={1.5} />
                    <line x1={hpx - 4} x2={hpx + 4} y1={WALL_MID} y2={WALL_MID} stroke={C.centreAccent} strokeWidth={1} />
                    <line x1={hpx} x2={hpx} y1={WALL_MID - 4} y2={WALL_MID + 4} stroke={C.centreAccent} strokeWidth={1} />

                    {/* ← fromLeft  (above wall) */}
                    <text x={hpx} y={WALL_TOP - 7} textAnchor="middle" fontSize={8} fill={C.textPrimary} fontWeight={700}>
                      ←{h.fromLeft}cm
                    </text>

                    {/* fromRight →  (below wall) */}
                    <text x={hpx} y={FROM_R_Y} textAnchor="middle" fontSize={8} fill={C.textMuted}>
                      {h.fromRight}cm→
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* ── Dimension ruler band (below wall) ── */}
        {items.length > 0 && (
          <g>
            {/* Baseline */}
            <line x1={PAD} x2={PAD + drawW} y1={RULER_Y} y2={RULER_Y} stroke={C.rulerBase} strokeWidth={1} />
            {/* Wall edge ticks */}
            <line x1={PAD}        x2={PAD}        y1={RULER_Y - 5} y2={RULER_Y + 5} stroke={C.arrowColor} strokeWidth={1.5} />
            <line x1={PAD + drawW} x2={PAD + drawW} y1={RULER_Y - 5} y2={RULER_Y + 5} stroke={C.arrowColor} strokeWidth={1.5} />

            {segments.map((seg, si) => {
              const x1   = toX(seg.start);
              const x2   = toX(seg.end);
              const midX = (x1 + x2) / 2;
              const pxW  = x2 - x1;
              return (
                <g key={si}>
                  <line x1={x1} x2={x1} y1={RULER_Y - 4} y2={RULER_Y + 4} stroke={seg.colour} strokeWidth={1} />
                  <line x1={x2} x2={x2} y1={RULER_Y - 4} y2={RULER_Y + 4} stroke={seg.colour} strokeWidth={1} />
                  {pxW > 22 && (
                    <text x={midX} y={RULER_LBL_Y} textAnchor="middle" fontSize={9} fill={seg.colour}>
                      {seg.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>

      <p className="text-xs mt-2" style={{ color: 'var(--lt-subtle)' }}>← from left wall edge &nbsp;·&nbsp; from right wall edge →</p>
    </div>
  );
};
