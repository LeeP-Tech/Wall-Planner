import React from 'react';
import type { HoleResult } from '../lib/types';

const COLOURS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6',
];

interface Props {
  holes: HoleResult[];
  /** Item ids in order, used to assign consistent colours */
  orderedItemIds: string[];
}

const fmt = (n: number) => {
  const fixed = n.toFixed(1);
  // Trim unnecessary trailing ".0" for tidiness
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
};

const sign = (n: number) => (n > 0 ? '+' : '') + fmt(n);

export const MeasurementTable: React.FC<Props> = ({ holes, orderedItemIds }) => {
  if (holes.length === 0) {
    return (
      <div className="wp-panel">
        <h2 className="wp-heading">Drill positions</h2>
        <p className="text-sm italic" style={{ color: 'var(--lt-subtle)' }}>Add items to see measurements.</p>
      </div>
    );
  }

  // Group holes by item in order
  const grouped = orderedItemIds.map(id => holes.filter(h => h.itemId === id));
  const colourForId = (id: string) => {
    const i = orderedItemIds.indexOf(id);
    return COLOURS[i % COLOURS.length];
  };

  return (
    <div className="wp-panel overflow-x-auto">
      <h2 className="wp-heading">Drill positions</h2>
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr style={{ background: 'var(--lt-panel-strong)', color: 'var(--lt-subtle)' }} className="text-xs uppercase tracking-wide">
            <th className="px-3 py-2 text-left font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>Item</th>
            <th className="px-3 py-2 text-left font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>Hole</th>
            <th className="px-3 py-2 text-right font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>From left (cm)</th>
            <th className="px-3 py-2 text-right font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>From right (cm)</th>
            <th className="px-3 py-2 text-right font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>From centre (cm)</th>
            <th className="px-3 py-2 text-right font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>Gap to next hole (cm)</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(itemHoles => {
            if (itemHoles.length === 0) return null;
            const itemId = itemHoles[0].itemId;
            const itemName = itemHoles[0].itemName;
            const colour = colourForId(itemId);
            return (
              <React.Fragment key={itemId}>
                {itemHoles.map((h, hi) => (
                  <tr key={hi} style={{ borderBottom: '1px solid var(--lt-line)' }} className="transition-colors hover:bg-white/5">
                    {hi === 0 ? (
                      <td
                        rowSpan={itemHoles.length}
                        className="px-3 py-2 font-semibold align-top"
                        style={{ color: colour, borderRight: `1px solid var(--lt-line)`, borderLeft: `3px solid ${colour}` }}
                      >
                        {itemName}
                      </td>
                    ) : null}
                    <td className="px-3 py-2 text-center" style={{ color: 'var(--lt-subtle)' }}>{h.holeIndex + 1}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold" style={{ color: 'var(--lt-ink)' }}>{fmt(h.fromLeft)}</td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--lt-subtle)' }}>{fmt(h.fromRight)}</td>
                    <td className={`px-3 py-2 text-right font-mono`} style={{ color: h.fromCenter < 0 ? '#ff6b8a' : h.fromCenter > 0 ? 'var(--lt-cyan)' : 'var(--lt-ink)' }}>
                      {sign(h.fromCenter)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--lt-subtle)' }}>
                      {h.distToNextHole !== undefined ? fmt(h.distToNextHole) : '—'}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs mt-3" style={{ color: 'var(--lt-subtle)' }}>
        From centre: negative = left of wall centre, positive = right of wall centre
      </p>
    </div>
  );
};
