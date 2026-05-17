import React from 'react';
import type { AccuracyStepMm, HoleResult, UnitSystem } from '../lib/types';
import { formatLengthWithAccuracy, formatSignedLength } from '../lib/units';

const COLOURS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6',
];

interface Props {
  holes: HoleResult[];
  /** Item ids in order, used to assign consistent colours */
  orderedItemIds: string[];
  unitSystem: UnitSystem;
  accuracyStepMm: AccuracyStepMm;
}

export const MeasurementTable: React.FC<Props> = ({ holes, orderedItemIds, unitSystem, accuracyStepMm }) => {
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
            <th className="px-3 py-2 text-right font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>From left</th>
            <th className="px-3 py-2 text-right font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>From right</th>
            <th className="px-3 py-2 text-right font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>From top</th>
            <th className="px-3 py-2 text-right font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>From bottom</th>
            <th className="px-3 py-2 text-right font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>From centre</th>
            <th className="px-3 py-2 text-right font-semibold" style={{ borderBottom: '1px solid var(--lt-line)' }}>Gap to next hole</th>
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
                    <td className="px-3 py-2 text-right font-mono font-semibold" style={{ color: 'var(--lt-ink)' }}>{formatLengthWithAccuracy(h.fromLeft, unitSystem, accuracyStepMm)}</td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--lt-subtle)' }}>{formatLengthWithAccuracy(h.fromRight, unitSystem, accuracyStepMm)}</td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--lt-subtle)' }}>{formatLengthWithAccuracy(h.fromTop, unitSystem, accuracyStepMm)}</td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--lt-subtle)' }}>{formatLengthWithAccuracy(h.fromBottom, unitSystem, accuracyStepMm)}</td>
                    <td className={`px-3 py-2 text-right font-mono`} style={{ color: h.fromCenter < 0 ? '#ff6b8a' : h.fromCenter > 0 ? 'var(--lt-cyan)' : 'var(--lt-ink)' }}>
                      {formatSignedLength(h.fromCenter, unitSystem, accuracyStepMm)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--lt-subtle)' }}>
                      {h.distToNextHole !== undefined ? formatLengthWithAccuracy(h.distToNextHole, unitSystem, accuracyStepMm) : '—'}
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
