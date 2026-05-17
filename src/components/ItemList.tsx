import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AccuracyStepMm, ItemDef, UnitSystem, WallConfig } from '../lib/types';
import { autoAssignRows } from '../lib/calculations';
import { formatLengthWithAccuracy } from '../lib/units';
import { ItemForm } from './ItemForm';

// Palette of colours to cycle through for items
const COLOURS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6',
];

interface Props {
  items: ItemDef[];
  wallConfig: WallConfig;
  unitSystem: UnitSystem;
  accuracyStepMm: AccuracyStepMm;
  onChange: (items: ItemDef[]) => void;
}

export const ItemList: React.FC<Props> = ({ items, wallConfig, unitSystem, accuracyStepMm, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const colour = (idx: number) => COLOURS[idx % COLOURS.length];

  const add = (item: ItemDef) => {
    onChange([...items, item]);
    setShowAddForm(false);
  };

  const update = (item: ItemDef) => {
    onChange(items.map(i => (i.id === item.id ? item : i)));
    setEditingId(null);
  };

  const copy = (item: ItemDef) => {
    const clone: ItemDef = { ...item, id: uuidv4(), name: `${item.name} (copy)` };
    const idx = items.findIndex(i => i.id === item.id);
    const next = [...items];
    next.splice(idx + 1, 0, clone);
    onChange(next);
  };

  const remove = (id: string) => {
    onChange(items.filter(i => i.id !== id));
  };

  const move = (id: string, direction: -1 | 1) => {
    const idx = items.findIndex(i => i.id === id);
    if (idx + direction < 0 || idx + direction >= items.length) return;
    const next = [...items];
    [next[idx], next[idx + direction]] = [next[idx + direction], next[idx]];
    onChange(next);
  };

  return (
    <div className="wp-panel space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="wp-heading" style={{ margin: 0 }}>Items</h2>
        <div className="flex gap-2">
          {items.length > 1 && (
            <button
              onClick={() => onChange(autoAssignRows(items, wallConfig))}
              className="wp-btn-secondary"
              title="Distribute items evenly across rows based on wall width"
            >
              Auto rows
            </button>
          )}
          {!showAddForm && (
            <button
              onClick={() => { setShowAddForm(true); setEditingId(null); }}
              className="wp-btn-primary"
            >
              + Add item
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <ItemForm
          unitSystem={unitSystem}
          onSave={add}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {items.length === 0 && !showAddForm && (
        <p className="text-sm italic" style={{ color: 'var(--lt-subtle)' }}>No items yet — add one above.</p>
      )}

      {items.map((item, idx) => (
        <div key={item.id}>
          {editingId === item.id ? (
            <ItemForm
              initial={item}
              unitSystem={unitSystem}
              onSave={update}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="wp-item-row group">
              {/* Colour swatch */}
              <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: colour(idx) }}
              />

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--lt-ink)' }}>{item.name}</p>
                <p className="text-xs" style={{ color: 'var(--lt-subtle)' }}>
                  {formatLengthWithAccuracy(item.width, unitSystem, accuracyStepMm)} x {formatLengthWithAccuracy(item.height, unitSystem, accuracyStepMm)} · row {item.row} ·{' '}
                  {item.holeCount === 1
                    ? '1 hole'
                    : `${item.holeCount} holes (spacing ${formatLengthWithAccuracy(item.holeSpacing, unitSystem, accuracyStepMm)})`}
                  {item.holeOffset !== 0 && ` · offset ${formatLengthWithAccuracy(item.holeOffset, unitSystem, accuracyStepMm)}`}
                  {(item.holeVerticalOffset ?? 0) !== 0 && ` · v-offset ${formatLengthWithAccuracy(item.holeVerticalOffset ?? 0, unitSystem, accuracyStepMm)}`}
                  {item.gutterBefore !== undefined && ` · gutter before ${formatLengthWithAccuracy(item.gutterBefore, unitSystem, accuracyStepMm)}`}
                </p>
              </div>

              {/* Actions — always visible on touch, hover-reveal on pointer devices */}
              <div className="flex items-center gap-0.5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity">
                <button
                  title="Move left"
                  disabled={idx === 0}
                  onClick={() => move(item.id, -1)}
                  className="wp-btn-icon"
                >←</button>
                <button
                  title="Move right"
                  disabled={idx === items.length - 1}
                  onClick={() => move(item.id, 1)}
                  className="wp-btn-icon"
                >→</button>
                <button
                  title="Edit"
                  onClick={() => { setEditingId(item.id); setShowAddForm(false); }}
                  className="wp-btn-icon"
                >Edit</button>
                <button
                  title="Copy"
                  onClick={() => copy(item)}
                  className="wp-btn-icon"
                >Copy</button>
                <button
                  title="Delete"
                  onClick={() => remove(item.id)}
                  className="wp-btn-icon danger"
                >✕</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
