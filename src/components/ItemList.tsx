import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ItemDef } from '../lib/types';
import { ItemForm } from './ItemForm';

// Palette of colours to cycle through for items
const COLOURS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6',
];

interface Props {
  items: ItemDef[];
  onChange: (items: ItemDef[]) => void;
}

export const ItemList: React.FC<Props> = ({ items, onChange }) => {
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Items</h2>
        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Add item
          </button>
        )}
      </div>

      {showAddForm && (
        <ItemForm
          onSave={add}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {items.length === 0 && !showAddForm && (
        <p className="text-sm text-gray-400 italic">No items yet — add one above.</p>
      )}

      {items.map((item, idx) => (
        <div key={item.id}>
          {editingId === item.id ? (
            <ItemForm
              initial={item}
              onSave={update}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 group">
              {/* Colour swatch */}
              <div
                className="w-4 h-10 rounded flex-shrink-0"
                style={{ backgroundColor: colour(idx) }}
              />

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.width} cm wide ·{' '}
                  {item.holeCount === 1
                    ? '1 hole'
                    : `${item.holeCount} holes (spacing ${item.holeSpacing} cm)`}
                  {item.holeOffset !== 0 && ` · offset ${item.holeOffset} cm`}
                  {item.gutterBefore !== undefined && ` · gutter before ${item.gutterBefore} cm`}
                </p>
              </div>

              {/* Actions — always visible on touch, hover-reveal on desktop */}
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  title="Move left"
                  disabled={idx === 0}
                  onClick={() => move(item.id, -1)}
                  className="p-2 rounded hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30 text-gray-600"
                >←</button>
                <button
                  title="Move right"
                  disabled={idx === items.length - 1}
                  onClick={() => move(item.id, 1)}
                  className="p-2 rounded hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30 text-gray-600"
                >→</button>
                <button
                  title="Edit"
                  onClick={() => { setEditingId(item.id); setShowAddForm(false); }}
                  className="p-2 rounded hover:bg-gray-200 active:bg-gray-300 text-gray-600 text-xs font-medium"
                >Edit</button>
                <button
                  title="Copy"
                  onClick={() => copy(item)}
                  className="p-2 rounded hover:bg-gray-200 active:bg-gray-300 text-gray-600 text-xs font-medium"
                >Copy</button>
                <button
                  title="Delete"
                  onClick={() => remove(item.id)}
                  className="p-2 rounded hover:bg-red-100 active:bg-red-200 text-red-500 text-xs font-medium"
                >✕</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
