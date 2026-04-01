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
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Drill positions</h2>
        <p className="text-sm text-gray-400 italic">Add items to see measurements.</p>
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm overflow-x-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Drill positions</h2>
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <th className="px-3 py-2 text-left font-medium border-b border-gray-200">Item</th>
            <th className="px-3 py-2 text-left font-medium border-b border-gray-200">Hole</th>
            <th className="px-3 py-2 text-right font-medium border-b border-gray-200">From left (cm)</th>
            <th className="px-3 py-2 text-right font-medium border-b border-gray-200">From right (cm)</th>
            <th className="px-3 py-2 text-right font-medium border-b border-gray-200">From centre (cm)</th>
            <th className="px-3 py-2 text-right font-medium border-b border-gray-200">Gap to next hole (cm)</th>
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
                  <tr key={hi} className="hover:bg-gray-50 border-b border-gray-100">
                    {hi === 0 ? (
                      <td
                        rowSpan={itemHoles.length}
                        className="px-3 py-2 font-semibold align-top border-r border-gray-200"
                        style={{ color: colour, borderLeft: `3px solid ${colour}` }}
                      >
                        {itemName}
                      </td>
                    ) : null}
                    <td className="px-3 py-2 text-gray-500 text-center">{h.holeIndex + 1}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-gray-800">{fmt(h.fromLeft)}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-600">{fmt(h.fromRight)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${h.fromCenter < 0 ? 'text-rose-600' : h.fromCenter > 0 ? 'text-sky-600' : 'text-gray-800'}`}>
                      {sign(h.fromCenter)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-500">
                      {h.distToNextHole !== undefined ? fmt(h.distToNextHole) : '—'}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-3">
        From centre: negative = left of wall centre, positive = right of wall centre
      </p>
    </div>
  );
};
